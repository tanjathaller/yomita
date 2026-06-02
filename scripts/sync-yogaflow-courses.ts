/**
 * Liest Kurse aus Supabase und schreibt `data/yogaflow-courses.json` (Artefakt; i. d. R. nicht
 * mehr ins Site-Repo committet). Veröffentlichung ins Daten-Repo: `npm run publish:yogaflow`.
 * Restplätze: bevorzugt per Playwright aus der YogaFlow-Web-App (YOGAFLOW_APP_URL),
 * sonst Fallback über `registrations` (oft unvollständig wegen RLS).
 *
 * Env: YOGAFLOW_SUPABASE_URL, YOGAFLOW_SUPABASE_ANON_KEY, YOGAFLOW_SYNC_EMAIL,
 * YOGAFLOW_SYNC_PASSWORD; optional YOGAFLOW_APP_URL (Playwright) und
 * YOGAFLOW_SUPABASE_COURSES_EXTRA_FIELDS (Restplätze direkt aus `courses`, falls Spalten existieren).
 *
 * Restplätze primär: Supabase-RPC `get_course_participant_counts` (registered_count + max_participants).
 *
 * Als `.ts` (nicht `.mts`), damit `tsx`/Node benannte Imports aus `./yogaflow-playwright-status` zuverlässig auflösen.
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";

import type { InternalCourse } from "../types/site-content";

import yogaflowCoursesFileSchema from "../lib/schemas/yogaflow-courses-file";
import {
  remainingFromCourseLikeRow,
  scrapeRemainingSpotsFromYogaflowApp,
} from "./yogaflow-playwright-status";

type SupabaseCourseRow = {
  id: string;
  title: string | null;
  description: string | null;
  date: string;
  time: string;
  end_time: string | null;
  location: string | null;
  max_participants: number;
  price: number | string | null;
  duration: number | null;
  room: string | null;
  frequency: string | null;
  status: string | null;
};

type SupabaseRegistrationRow = {
  course_id: string;
  status: string | null;
  is_waitlist: boolean | null;
};

/** Entfernt Anführungszeichen/Newlines (häufig beim Kopieren aus dem Dashboard). */
function normalizeSecret(raw: string): string {
  let s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s.replace(/\r?\n/g, "").trim();
}

function requireEnv(name: string): string {
  const raw = process.env[name];
  const v = raw === undefined ? "" : normalizeSecret(raw);
  if (!v) {
    throw new Error(
      `Fehlende oder leere Umgebungsvariable: ${name}. In GitHub Actions: Repository Secret gleichen Namens setzen.`,
    );
  }
  return v;
}

function todayBerlinYmd(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const mo = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${mo}-${d}`;
}

function formatTimeHm(raw: string): string {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return raw.trim();
  return `${m[1]!.padStart(2, "0")}:${m[2]}`;
}

function formatDayDe(isoDate: string): string {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

function formatPriceEur(value: number | string | null): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (!Number.isFinite(n)) return undefined;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function buildTimeLabel(
  time: string,
  endTime: string | null,
  durationMin: number | null,
): string {
  const start = formatTimeHm(time);
  if (endTime) {
    const range = `${start}–${formatTimeHm(endTime)}`;
    if (durationMin && durationMin > 0) {
      return `${range} (${durationMin} Min.)`;
    }
    return range;
  }
  if (durationMin && durationMin > 0) {
    return `${start} (${durationMin} Min.)`;
  }
  return start;
}

function locationLabel(location: string | null, room: string | null): string {
  const loc = (location ?? "").trim();
  const r = (room ?? "").trim();
  if (loc && r) return `${loc} · ${r}`;
  return loc || r || "Ort nach Absprache";
}

async function supabasePasswordGrant(
  baseUrl: string,
  anonKey: string,
  email: string,
  password: string,
): Promise<string> {
  const res = await fetch(
    `${baseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    let hint = "";
    try {
      const body = JSON.parse(text) as { error_code?: string };
      if (body.error_code === "invalid_credentials") {
        hint =
          "\n\nHinweis: E-Mail oder Passwort falsch – oder der Account existiert nicht in DIESEM Supabase-Projekt (URL + Anon-Key müssen zum gleichen Projekt wie in der YogaFlow-App passen). In GitHub: Secrets YOGAFLOW_SYNC_EMAIL / YOGAFLOW_SYNC_PASSWORD prüfen. Nach Passwort-Änderung das Secret aktualisieren.";
      }
    } catch {
      /* ignore */
    }
    throw new Error(`Supabase Auth fehlgeschlagen (${res.status}): ${text}${hint}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Supabase Auth: Kein access_token in der Antwort.");
  }
  return data.access_token;
}

async function fetchAllRows<T>(
  baseUrl: string,
  pathWithQuery: string,
  anonKey: string,
  jwt: string,
): Promise<T[]> {
  const url = `${baseUrl.replace(/\/$/, "")}${pathWithQuery}`;
  const pageSize = 1000;
  let offset = 0;
  const out: T[] = [];

  for (;;) {
    const res = await fetch(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
        Range: `${offset}-${offset + pageSize - 1}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase REST ${res.status}: ${text}`);
    }

    const batch = (await res.json()) as T[];
    out.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  return out;
}

type RpcParticipantCountRow = {
  course_id: string;
  registered_count: number;
  waitlist_count?: number;
};

/** `sub` aus dem Supabase-User-JWT (für RPCs mit User-/Teacher-Parameter). */
function decodeJwtSub(jwt: string): string | undefined {
  const parts = jwt.split(".");
  if (parts.length < 2) return undefined;
  try {
    const payloadB64 = parts[1]!;
    const json = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as { sub?: string };
    return typeof payload.sub === "string" ? payload.sub : undefined;
  } catch {
    return undefined;
  }
}

function parseRpcParticipantRows(data: unknown): Map<string, number> {
  const out = new Map<string, number>();
  if (!Array.isArray(data)) return out;
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const row = item as RpcParticipantCountRow;
    if (typeof row.course_id !== "string") continue;
    const raw = row.registered_count;
    const n =
      typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    if (!Number.isFinite(n)) continue;
    out.set(row.course_id, Math.max(0, Math.floor(n)));
  }
  return out;
}

/**
 * POST /rest/v1/rpc/get_course_participant_counts →
 * [{ course_id, registered_count, waitlist_count }, …]
 *
 * PostgREST-Hinweis PGRST202: z. B. `get_course_participant_counts(p_course_ids)` –
 * wir senden die geladenen Kurs-IDs; sonst typische User-Parameter aus dem JWT-`sub`.
 */
async function fetchRegisteredCountsFromRpc(
  baseUrl: string,
  anonKey: string,
  jwt: string,
  courseIds: string[],
): Promise<Map<string, number>> {
  const url = `${baseUrl.replace(/\/$/, "")}/rest/v1/rpc/get_course_participant_counts`;
  const customPayload = normalizeSecret(
    process.env.YOGAFLOW_RPC_PARTICIPANT_COUNTS_PAYLOAD ?? "",
  );

  const headersJson: Record<string, string> = {
    apikey: anonKey,
    Authorization: `Bearer ${jwt}`,
    Accept: "application/json",
  };

  const postJson = (body: string) =>
    fetch(url, {
      method: "POST",
      headers: { ...headersJson, "Content-Type": "application/json" },
      body,
    });

  if (customPayload !== "") {
    const res = await postJson(customPayload);
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`${res.status}: ${text}`);
    }
    const data = text ? (JSON.parse(text) as unknown) : null;
    return parseRpcParticipantRows(data);
  }

  const sub = decodeJwtSub(jwt);
  const bodies: string[] = [];
  if (courseIds.length > 0) {
    bodies.push(JSON.stringify({ p_course_ids: courseIds }));
  }
  bodies.push("{}");
  if (sub) {
    const keys = [
      "user_id",
      "p_user_id",
      "teacher_id",
      "p_teacher_id",
      "input_user_id",
    ] as const;
    for (const k of keys) {
      bodies.push(JSON.stringify({ [k]: sub }));
    }
  }

  let lastError = "";
  for (const body of bodies) {
    const res = await postJson(body);
    const text = await res.text();
    if (res.ok) {
      const data = text ? (JSON.parse(text) as unknown) : null;
      const map = parseRpcParticipantRows(data);
      const preview = body.length > 100 ? `${body.slice(0, 100)}…` : body;
      console.log(
        `Supabase RPC get_course_participant_counts: OK (${map.size} Kurse, Body: ${preview})`,
      );
      return map;
    }
    lastError = `${res.status}: ${text}`;
    const retry404Signature =
      res.status === 404 &&
      (text.includes("PGRST202") ||
        text.includes("Could not find the function"));
    if (!retry404Signature) {
      throw new Error(lastError);
    }
  }

  const resGet = await fetch(url, { method: "GET", headers: headersJson });
  const textGet = await resGet.text();
  if (resGet.ok) {
    const data = textGet ? (JSON.parse(textGet) as unknown) : null;
    console.log(
      "Supabase RPC get_course_participant_counts: OK per GET (ohne Body).",
    );
    return parseRpcParticipantRows(data);
  }
  throw new Error(lastError || `${resGet.status}: ${textGet}`);
}

function countOccupiedForCourse(
  registrations: SupabaseRegistrationRow[],
  courseId: string,
): number {
  return registrations.filter((r) => {
    if (r.course_id !== courseId) return false;
    if (r.is_waitlist === true) return false;
    const st = (r.status ?? "").trim().toLowerCase();
    return st === "registered";
  }).length;
}

function remainingFromRegistrations(
  row: SupabaseCourseRow,
  registrations: SupabaseRegistrationRow[],
): number {
  const occupied = countOccupiedForCourse(registrations, row.id);
  const cap = Math.max(1, row.max_participants);
  return Math.max(0, cap - occupied);
}

function rowToInternalCourse(
  row: SupabaseCourseRow,
  sortOrder: number,
  remainingSpots: number,
): InternalCourse {
  const scheduleNote =
    row.frequency && row.frequency !== "one_time"
      ? row.frequency
      : undefined;

  return {
    id: row.id,
    type: "internal",
    title: (row.title ?? "").trim() || "Yoga-Kurs",
    description: (row.description ?? "").trim(),
    day: formatDayDe(row.date),
    time: buildTimeLabel(row.time, row.end_time, row.duration ?? 60),
    location: locationLabel(row.location, row.room),
    bookingStatus: remainingSpots === 0 ? "full" : "available",
    price: formatPriceEur(row.price),
    remainingSpots,
    sortOrder,
    scheduleNote,
    startsOn: row.date,
  };
}

async function main() {
  const baseUrl = requireEnv("YOGAFLOW_SUPABASE_URL");
  const anonKey = requireEnv("YOGAFLOW_SUPABASE_ANON_KEY");
  const email = requireEnv("YOGAFLOW_SYNC_EMAIL");
  const password = requireEnv("YOGAFLOW_SYNC_PASSWORD");
  const tenantId = normalizeSecret(process.env.YOGAFLOW_TENANT_ID ?? "");

  const jwt = await supabasePasswordGrant(baseUrl, anonKey, email, password);
  const today = todayBerlinYmd();

  const baseSelect =
    "id,title,description,date,time,end_time,location,max_participants,price,duration,room,frequency,status";
  const extraFields = normalizeSecret(
    process.env.YOGAFLOW_SUPABASE_COURSES_EXTRA_FIELDS ?? "",
  ).replace(/[^a-zA-Z0-9_,]/g, "");

  let courses: SupabaseCourseRow[];

  const tenantFilter = tenantId ? `&tenant_id=eq.${tenantId}` : "";

  if (extraFields) {
    const pathWithExtra =
      `/rest/v1/courses?select=${baseSelect},${extraFields}` +
      `${tenantFilter}&status=eq.active&date=gte.${today}&order=date.asc,time.asc`;
    try {
      courses = await fetchAllRows<SupabaseCourseRow>(
        baseUrl,
        pathWithExtra,
        anonKey,
        jwt,
      );
      console.log(
        `Supabase: Kurse mit Zusatzfeldern geladen (${extraFields}).`,
      );
    } catch {
      console.warn(
        `Supabase: Zusatzfelder „${extraFields}" schlagen fehl – nutze Standard-Select (Spalten in der DB prüfen).`,
      );
      const pathBase =
        `/rest/v1/courses?select=${baseSelect}` +
        `${tenantFilter}&status=eq.active&date=gte.${today}&order=date.asc,time.asc`;
      courses = await fetchAllRows<SupabaseCourseRow>(
        baseUrl,
        pathBase,
        anonKey,
        jwt,
      );
    }
  } else {
    const coursePath =
      `/rest/v1/courses?select=${baseSelect}` +
      `${tenantFilter}&status=eq.active&date=gte.${today}&order=date.asc,time.asc`;
    courses = await fetchAllRows<SupabaseCourseRow>(
      baseUrl,
      coursePath,
      anonKey,
      jwt,
    );
  }

  const appUrl = normalizeSecret(process.env.YOGAFLOW_APP_URL ?? "");
  const remainingById = new Map<string, number>();

  const skipRpc =
    normalizeSecret(
      process.env.YOGAFLOW_SKIP_PARTICIPANT_COUNTS_RPC ?? "",
    ).toLowerCase() === "true" ||
    normalizeSecret(process.env.YOGAFLOW_SKIP_PARTICIPANT_COUNTS_RPC ?? "") ===
      "1";

  if (!skipRpc) {
    try {
      const registeredByCourse = await fetchRegisteredCountsFromRpc(
        baseUrl,
        anonKey,
        jwt,
        courses.map((c) => c.id),
      );
      let matched = 0;
      for (const row of courses) {
        const reg = registeredByCourse.get(row.id);
        if (reg === undefined) continue;
        const cap = Math.max(1, row.max_participants);
        remainingById.set(row.id, Math.max(0, cap - reg));
        matched += 1;
      }
      console.log(
        `Supabase RPC get_course_participant_counts: ${registeredByCourse.size} Einträge, ${matched} in der aktuellen Kursliste mit Restplätzen.`,
      );
    } catch (e) {
      console.warn(
        `RPC get_course_participant_counts nicht nutzbar: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  for (const row of courses) {
    if (remainingById.has(row.id)) continue;
    const fromRow = remainingFromCourseLikeRow(
      row as unknown as Record<string, unknown>,
    );
    if (fromRow !== undefined) {
      remainingById.set(row.id, fromRow);
    }
  }

  if (appUrl) {
    const needScrape = courses.filter((row) => !remainingById.has(row.id));
    if (needScrape.length > 0) {
      console.log(
        `YOGAFLOW_APP_URL gesetzt – Restplätze per Playwright für ${needScrape.length}/${courses.length} Kurse (ohne DB-Zahl) …`,
      );
      const scraped = await scrapeRemainingSpotsFromYogaflowApp({
        appUrl,
        email,
        password,
        courses: needScrape.map((row) => ({
          id: row.id,
          title: (row.title ?? "").trim() || "Yoga-Kurs",
          dayDe: formatDayDe(row.date),
          startsOn: row.date,
          maxParticipants: Math.max(1, row.max_participants),
        })),
      });
      for (const row of needScrape) {
        remainingById.set(row.id, scraped.get(row.id) ?? 99);
      }
    } else {
      console.log(
        "Restplätze vollständig aus Supabase-Kurszeilen – Playwright übersprungen.",
      );
    }
  } else {
    console.warn(
      "YOGAFLOW_APP_URL fehlt – Restplätze nur über registrations (kann durch RLS falsch sein). Bitte App-URL setzen.",
    );
    const registrationPath =
      "/rest/v1/registrations?select=course_id,status,is_waitlist";
    const registrations = await fetchAllRows<SupabaseRegistrationRow>(
      baseUrl,
      registrationPath,
      anonKey,
      jwt,
    );
    for (const row of courses) {
      if (remainingById.has(row.id)) continue;
      remainingById.set(row.id, remainingFromRegistrations(row, registrations));
    }
  }

  const mapped: InternalCourse[] = courses.map((row, index) =>
    rowToInternalCourse(row, (index + 1) * 10, remainingById.get(row.id) ?? 99),
  );

  const payload = {
    syncedAt: new Date().toISOString(),
    courses: mapped,
  };

  yogaflowCoursesFileSchema.parse(payload);

  const outPath = path.join(process.cwd(), "data", "yogaflow-courses.json");
  await writeFile(`${outPath}`, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");

  console.log(
    `YogaFlow-Sync OK: ${mapped.length} Kurse → ${outPath} (syncedAt ${payload.syncedAt})`,
  );
}

main().catch((err) => {
  console.error(
    err instanceof Error ? err.message : err,
    err instanceof Error && err.stack ? `\n${err.stack}` : "",
  );
  process.exitCode = 1;
});
