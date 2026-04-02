/**
 * Öffnet die YogaFlow-Web-App, loggt ein und ermittelt Restplätze.
 *
 * Strategie (Priorität):
 * (1) **Netzwerk:** JSON-Responses (Supabase `rest/v1`, `/api/`, …) mit Kurs-`id` + Restplatz-Feldern.
 * (2) Rohes HTML um UUID (falls die App IDs ins Markup schreibt).
 * (3) `innerText` mit Titel+Datum.
 *
 * Optional: `YOGAFLOW_SCRAPE_DEBUG=true` – Snippets bei fehlendem Treffer.
 */

import { chromium, type Response } from "playwright";

const COURSE_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isCourseUuid(s: string): boolean {
  return COURSE_UUID_RE.test(s);
}

function numField(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Typische Feldnamen aus Supabase / YogaFlow-ähnlichen APIs (REST + eingebettete JSON-Responses). */
export function remainingFromCourseLikeRow(
  row: Record<string, unknown>,
): number | undefined {
  const direct =
    numField(row.remaining_spots) ??
    numField(row.available_spots) ??
    numField(row.spots_remaining) ??
    numField(row.free_spots) ??
    numField(row.open_spots) ??
    numField(row.remainingSpots) ??
    numField(row.availableSpots) ??
    numField(row.spotsRemaining);
  if (direct !== undefined) return Math.max(0, Math.floor(direct));

  const max =
    numField(row.max_participants) ??
    numField(row.maxParticipants) ??
    numField(row.capacity);
  const taken =
    numField(row.registered_count) ??
    numField(row.booked_count) ??
    numField(row.current_participants) ??
    numField(row.participant_count) ??
    numField(row.registration_count) ??
    numField(row.participants) ??
    numField(row.booked);
  if (max !== undefined && taken !== undefined) {
    return Math.max(0, Math.floor(max - taken));
  }
  return undefined;
}

function ingestCourseLikeJson(json: unknown, into: Map<string, number>): void {
  const tryRow = (o: unknown) => {
    if (!o || typeof o !== "object" || Array.isArray(o)) return;
    const row = o as Record<string, unknown>;
    const id = row.id;
    if (typeof id !== "string" || !isCourseUuid(id)) return;
    const rem = remainingFromCourseLikeRow(row);
    if (rem !== undefined) into.set(id, rem);
  };

  if (Array.isArray(json)) {
    for (let i = 0; i < json.length; i++) tryRow(json[i]);
    return;
  }
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    const keys = ["data", "courses", "items", "results", "records", "rows"];
    for (let ki = 0; ki < keys.length; ki++) {
      const v = o[keys[ki]!];
      if (Array.isArray(v)) {
        for (let i = 0; i < v.length; i++) tryRow(v[i]);
      }
    }
    tryRow(json);

    const data = o.data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const inner = data as Record<string, unknown>;
      for (const ik of ["courses", "items", "rows", "data"]) {
        const v = inner[ik];
        if (Array.isArray(v)) {
          for (let i = 0; i < v.length; i++) tryRow(v[i]);
        }
      }
    }
  }
}

function responseUrlLooksLikeCourseApi(u: string): boolean {
  const url = u.toLowerCase();
  if (url.includes("/rest/v1/")) return true;
  if (url.includes("supabase.co/")) return true;
  if (url.includes("/api/")) return true;
  if (url.includes("graphql")) return true;
  return false;
}

/** Gleiche Origin wie die App (z. B. Vite/Bolt proxy) oder typische API-Pfade. */
function looksLikeParticipantCountRows(json: unknown): json is unknown[] {
  if (!Array.isArray(json) || json.length === 0) return false;
  const first = json[0];
  if (!first || typeof first !== "object") return false;
  const o = first as Record<string, unknown>;
  return typeof o.course_id === "string" && "registered_count" in o;
}

/** Antwort von `rpc/get_course_participant_counts`: [{ course_id, registered_count, … }]. */
function ingestRegisteredCountsRpcJson(
  json: unknown,
  into: Map<string, number>,
): void {
  if (!Array.isArray(json)) return;
  for (let i = 0; i < json.length; i++) {
    const item = json[i];
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const cid = row.course_id;
    const rc = row.registered_count;
    if (typeof cid !== "string" || !isCourseUuid(cid)) continue;
    const n =
      typeof rc === "number" ? rc : typeof rc === "string" ? Number(rc) : NaN;
    if (!Number.isFinite(n)) continue;
    into.set(cid, Math.max(0, Math.floor(n)));
  }
}

function responseMightCarryCourseJson(
  responseUrl: string,
  appBaseUrl: string,
): boolean {
  if (responseUrlLooksLikeCourseApi(responseUrl)) return true;
  try {
    const ru = new URL(responseUrl);
    const app = new URL(
      appBaseUrl.startsWith("http") ? appBaseUrl : `https://${appBaseUrl}`,
    );
    if (ru.origin === app.origin) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export type CourseKeyForScrape = {
  id: string;
  title: string;
  dayDe: string;
  startsOn: string;
  maxParticipants: number;
};

export function dateLabelVariants(dayDe: string, startsOn: string): string[] {
  const out = new Set<string>();
  const d0 = dayDe.trim();
  if (d0) out.add(d0);

  const m = startsOn.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return [...out];

  const y = m[1]!;
  const moNum = Number.parseInt(m[2]!, 10);
  const dNum = Number.parseInt(m[3]!, 10);
  const moP = String(moNum).padStart(2, "0");
  const dP = String(dNum).padStart(2, "0");

  out.add(`${dP}.${moP}.${y}`);
  out.add(`${dNum}.${moNum}.${y}`);
  out.add(`${dNum}.${moP}.${y}`);
  out.add(`${dP}.${moNum}.${y}`);
  out.add(startsOn.trim());
  return [...out];
}

function firstStatusLabelInPlainText(plain: string): string {
  const strong =
    /noch\s+\d+\s+restplätze?|noch\s+1\s+restplatz|\d+\s+freie\s+plätze|nur\s+noch\s+\d+|noch\s+\d+\s+plätze?\s+frei/gi;
  let m = strong.exec(plain);
  if (m) return m[0]!.trim();
  const weak = /verfügbar|leider\s+schon\s+ausgebucht|ausgebucht/gi;
  m = weak.exec(plain);
  if (m) return m[0]!.trim();
  return "";
}

/** Nur Zahl oder Ausgebucht – kein generisches „Verfügbar“ aus dem HTML-Kontext. */
function labelIsTrustworthyFromHtmlChunk(label: string): boolean {
  const t = label.trim().toLowerCase();
  if (!t) return false;
  if (t.includes("ausgebucht")) return true;
  if (/\d/.test(t) && /noch|frei|platz|plätze|rest/.test(t)) return true;
  return false;
}

function roughPlainFromHtml(htmlSlice: string): string {
  return htmlSlice
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ");
}

function statusLabelFromHtmlNearCourseId(html: string, id: string): string {
  let pos = 0;
  let best = "";
  while (pos < html.length) {
    const i = html.indexOf(id, pos);
    if (i === -1) break;
    const chunk = html.slice(
      Math.max(0, i - 1500),
      Math.min(html.length, i + 16000),
    );
    const plain = roughPlainFromHtml(chunk);
    const label = firstStatusLabelInPlainText(plain);
    if (label) {
      best = label;
      if (labelIsTrustworthyFromHtmlChunk(label)) {
        break;
      }
    }
    pos = i + id.length;
  }
  return best && labelIsTrustworthyFromHtmlChunk(best) ? best : "";
}

export function parseRemainingFromStatusLabel(label: string): number {
  const t = label.trim().toLowerCase();
  if (!t) return 99;
  if (t.includes("leider") && t.includes("ausgebucht")) return 0;
  if (t.includes("ausgebucht") && !t.includes("noch")) return 0;
  let mNum = t.match(/noch\s+(\d+)\s+restplätze?/);
  if (mNum) return Math.max(0, parseInt(mNum[1]!, 10));
  if (/noch\s+1\s+restplatz/.test(t)) return 1;
  mNum = t.match(/(\d+)\s+freie\s+plätze/);
  if (mNum) return Math.max(0, parseInt(mNum[1]!, 10));
  mNum = t.match(/nur\s+noch\s+(\d+)/);
  if (mNum) return Math.max(0, parseInt(mNum[1]!, 10));
  mNum = t.match(/noch\s+(\d+)\s+plätze?\s+frei/);
  if (mNum) return Math.max(0, parseInt(mNum[1]!, 10));
  if (t.includes("verfügbar")) return 99;
  return 99;
}

function scrapeDebugEnabled(): boolean {
  const v = (process.env.YOGAFLOW_SCRAPE_DEBUG ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export async function scrapeRemainingSpotsFromYogaflowApp(options: {
  appUrl: string;
  email: string;
  password: string;
  courses: CourseKeyForScrape[];
}): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const gotExplicitLabel = new Set<string>();
  const url = options.appUrl.replace(/\/$/, "");
  const debug = scrapeDebugEnabled();

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-http-cache"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1400, height: 900 },
      locale: "de-DE",
    });
    const networkRemaining = new Map<string, number>();
    const rpcRegisteredByCourseId = new Map<string, number>();
    const inflight: Promise<void>[] = [];

    const onResponse = (response: Response) => {
      inflight.push(
        (async () => {
          if (response.status() < 200 || response.status() >= 300) return;
          const responseUrl = response.url();
          const requestUrl = response.request().url();
          const combined = `${responseUrl}\n${requestUrl}`.toLowerCase();
          const isParticipantRpc =
            combined.includes("get_course_participant_counts") ||
            combined.includes("participant_counts");
          const fromSupabaseRest =
            combined.includes("supabase") || combined.includes("/rest/v1/");
          if (
            !isParticipantRpc &&
            !fromSupabaseRest &&
            !responseMightCarryCourseJson(responseUrl, url)
          ) {
            return;
          }
          const ct = (response.headers()["content-type"] ?? "").toLowerCase();
          if (
            !ct.includes("json") &&
            !isParticipantRpc &&
            !fromSupabaseRest
          ) {
            return;
          }
          try {
            const raw = await response.text();
            if (!raw.trim()) return;
            const json = JSON.parse(raw) as unknown;
            if (
              (isParticipantRpc || fromSupabaseRest) &&
              looksLikeParticipantCountRows(json)
            ) {
              ingestRegisteredCountsRpcJson(json, rpcRegisteredByCourseId);
            } else if (isParticipantRpc) {
              ingestRegisteredCountsRpcJson(json, rpcRegisteredByCourseId);
            } else {
              ingestCourseLikeJson(json, networkRemaining);
            }
          } catch {
            /* kein JSON */
          }
        })().catch(() => {}),
      );
    };

    context.on("response", onResponse);

    const page = await context.newPage();

    await page.goto(url, { waitUntil: "load", timeout: 90_000 });

    const emailLoc = page
      .locator('input[type="email"]')
      .or(page.locator('input[name="email"]'))
      .or(page.locator('input[autocomplete="email"]'))
      .or(page.getByPlaceholder(/e-mail|email|mail/i))
      .first();
    await emailLoc.waitFor({ state: "visible", timeout: 25_000 });
    await emailLoc.fill(options.email);

    const passLoc = page.locator('input[type="password"]').first();
    await passLoc.fill(options.password);

    const submit = page
      .locator('button[type="submit"]')
      .or(page.getByRole("button", { name: /anmelden|login|einloggen/i }))
      .first();
    await submit.click();

    await new Promise((r) => setTimeout(r, 6000));
    await page.waitForLoadState("networkidle", { timeout: 45_000 }).catch(
      () => {},
    );

    const base = url.replace(/\/$/, "");
    const coursesUrl = base.endsWith("/courses") ? base : `${base}/courses`;
    await page.goto(coursesUrl, { waitUntil: "load", timeout: 90_000 }).catch(
      () => {},
    );
    await new Promise((r) => setTimeout(r, 2500));
    await page.waitForLoadState("networkidle", { timeout: 45_000 }).catch(
      () => {},
    );

    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.scrollBy(0, 900));
      await new Promise((r) => setTimeout(r, 400));
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 800));

    context.off("response", onResponse);
    await Promise.allSettled(inflight);

    if (debug && rpcRegisteredByCourseId.size > 0) {
      console.warn(
        `[YOGAFLOW_SCRAPE_DEBUG] Netzwerk: get_course_participant_counts → ${rpcRegisteredByCourseId.size} Kurs-ID(s) mit registered_count.`,
      );
    }
    if (debug && networkRemaining.size > 0) {
      console.warn(
        `[YOGAFLOW_SCRAPE_DEBUG] Netzwerk: Restplatz-Daten für ${networkRemaining.size} Kurs-ID(s) aus weiteren JSON-Responses.`,
      );
    } else if (
      debug &&
      networkRemaining.size === 0 &&
      rpcRegisteredByCourseId.size === 0
    ) {
      console.warn(
        "[YOGAFLOW_SCRAPE_DEBUG] Netzwerk: keine nutzbaren JSON-Antworten (RPC-Zähler + übrige APIs).",
      );
    }

    const html = await page.content();

    for (const c of options.courses) {
      const reg = rpcRegisteredByCourseId.get(c.id);
      if (reg === undefined) continue;
      const cap = Math.max(1, c.maxParticipants);
      result.set(c.id, Math.max(0, cap - reg));
      gotExplicitLabel.add(c.id);
    }

    for (const c of options.courses) {
      if (gotExplicitLabel.has(c.id)) continue;
      const fromNet = networkRemaining.get(c.id);
      if (fromNet !== undefined) {
        result.set(c.id, fromNet);
        gotExplicitLabel.add(c.id);
      }
    }

    for (const c of options.courses) {
      if (gotExplicitLabel.has(c.id)) continue;
      const label = statusLabelFromHtmlNearCourseId(html, c.id);
      if (label) {
        result.set(c.id, parseRemainingFromStatusLabel(label));
        gotExplicitLabel.add(c.id);
      }
    }

    const needInnerText = options.courses.filter((c) => !gotExplicitLabel.has(c.id));

    if (needInnerText.length > 0) {
      const pairs = await page.evaluate(
        (expected: { id: string; title: string; dateVariants: string[] }[]) => {
          const strongRe =
            /noch\s+\d+\s+Restplätze?|noch\s+1\s+Restplatz|\d+\s+freie\s+Plätze|nur\s+noch\s+\d+|noch\s+\d+\s+Plätze?\s+frei/i;
          const weakRe = /Verfügbar|Leider\s+schon\s+ausgebucht|Ausgebucht/i;

          const out: { id: string; status: string }[] = [];
          const body = (document.body.innerText || "").replace(/\u00a0/g, " ");

          for (let ci = 0; ci < expected.length; ci++) {
            const c = expected[ci]!;
            const title = c.title.trim();
            const variants: string[] = [];
            for (let vi = 0; vi < c.dateVariants.length; vi++) {
              const v = c.dateVariants[vi];
              if (v) variants.push(v);
            }
            let found = "";

            let pos = 0;
            while (pos < body.length) {
              const ti = body.indexOf(title, pos);
              if (ti === -1) break;
              const start = Math.max(0, ti - 900);
              const end = Math.min(body.length, ti + 5200);
              const segment = body.slice(start, end);
              let hasDate = false;
              for (let di = 0; di < variants.length; di++) {
                const dv = variants[di]!;
                if (segment.includes(dv)) {
                  hasDate = true;
                  break;
                }
              }
              if (hasDate) {
                const sm = segment.match(strongRe);
                if (sm) {
                  found = sm[0]!.trim();
                  break;
                }
                const wm = segment.match(weakRe);
                if (wm) {
                  found = wm[0]!.trim();
                  break;
                }
              }
              pos = ti + 1;
            }

            if (!found) {
              outer: for (let dvi = 0; dvi < variants.length; dvi++) {
                const dv = variants[dvi]!;
                let dpos = 0;
                while (dpos < body.length) {
                  const j = body.indexOf(dv, dpos);
                  if (j === -1) break;
                  const dstart = Math.max(0, j - 1000);
                  const dend = Math.min(body.length, j + 2600);
                  const segment = body.slice(dstart, dend);
                  if (segment.includes(title)) {
                    const sm = segment.match(strongRe);
                    if (sm) {
                      found = sm[0]!.trim();
                      break outer;
                    }
                    const wm = segment.match(weakRe);
                    if (wm) {
                      found = wm[0]!.trim();
                      break outer;
                    }
                  }
                  dpos = j + 1;
                }
              }
            }

            out.push({ id: c.id, status: found });
          }

          return out;
        },
        needInnerText.map((c) => ({
          id: c.id,
          title: c.title,
          dateVariants: dateLabelVariants(c.dayDe, c.startsOn),
        })),
      );

      for (const p of pairs) {
        if (!p.status.trim()) continue;
        result.set(p.id, parseRemainingFromStatusLabel(p.status));
        gotExplicitLabel.add(p.id);
      }
    }

    for (const c of options.courses) {
      if (!result.has(c.id)) {
        result.set(c.id, 99);
      }
    }

    for (const c of options.courses) {
      const missed = !gotExplicitLabel.has(c.id);
      if (debug && missed) {
        const idx = html.indexOf(c.id);
        const snippet =
          idx === -1
            ? "(UUID nicht im HTML – App rendert ID vermutlich nicht im Markup)"
            : roughPlainFromHtml(
                html.slice(Math.max(0, idx - 300), idx + 5000),
              ).slice(0, 1400);
        console.warn(
          `[YOGAFLOW_SCRAPE_DEBUG] „${c.title}“ ${c.dayDe} id=${c.id}\n${snippet}\n---`,
        );
      } else if (!debug && missed) {
        console.warn(
          `Playwright: kein Statustext für „${c.title}“ (${c.dayDe}) – Fallback „Verfügbar“ (99). Tipp: YOGAFLOW_SCRAPE_DEBUG=true`,
        );
      }
    }
  } finally {
    await browser.close();
  }

  return result;
}
