/**
 * Liest Kurse aus Supabase und schreibt `data/yogaflow-courses.json`.
 * Restplätze: bevorzugt per Playwright aus der YogaFlow-Web-App (YOGAFLOW_APP_URL),
 * sonst Fallback über `registrations` (oft unvollständig wegen RLS).
 *
 * Env: YOGAFLOW_SUPABASE_URL, YOGAFLOW_SUPABASE_ANON_KEY, YOGAFLOW_SYNC_EMAIL,
 * YOGAFLOW_SYNC_PASSWORD; optional YOGAFLOW_APP_URL für korrekte Status-Anzeige.
 *
 * Als `.ts` (nicht `.mts`), damit `tsx`/Node benannte Imports aus `./yogaflow-playwright-status` zuverlässig auflösen.
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";

import type { InternalCourse } from "../types/site-content";

import yogaflowCoursesFileSchema from "../lib/schemas/yogaflow-courses-file";
import { scrapeRemainingSpotsFromYogaflowApp } from "./yogaflow-playwright-status";

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

  const jwt = await supabasePasswordGrant(baseUrl, anonKey, email, password);
  const today = todayBerlinYmd();

  const coursePath =
    `/rest/v1/courses?select=id,title,description,date,time,end_time,location,max_participants,price,duration,room,frequency,status` +
    `&status=eq.active&date=gte.${today}&order=date.asc,time.asc`;

  const courses = await fetchAllRows<SupabaseCourseRow>(
    baseUrl,
    coursePath,
    anonKey,
    jwt,
  );

  const appUrl = normalizeSecret(process.env.YOGAFLOW_APP_URL ?? "");
  const remainingById = new Map<string, number>();

  if (appUrl) {
    console.log(
      "YOGAFLOW_APP_URL gesetzt – Restplätze per Playwright aus der Web-App lesen …",
    );
    const scraped = await scrapeRemainingSpotsFromYogaflowApp({
      appUrl,
      email,
      password,
      courses: courses.map((row) => ({
        id: row.id,
        title: (row.title ?? "").trim() || "Yoga-Kurs",
        dayDe: formatDayDe(row.date),
        startsOn: row.date,
      })),
    });
    for (const row of courses) {
      remainingById.set(row.id, scraped.get(row.id) ?? 99);
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
