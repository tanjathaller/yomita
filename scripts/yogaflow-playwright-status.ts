/**
 * Öffnet die YogaFlow-Web-App, loggt ein und liest Verfügbarkeitstexte aus dem sichtbaren DOM
 * (gleiche Sicht wie im Browser). Kein Zugriff auf registrations in Supabase nötig.
 */

import { chromium } from "playwright";

export type CourseKeyForScrape = {
  id: string;
  title: string;
  dayDe: string;
  /** ISO YYYY-MM-DD – für Datumstext-Varianten im UI (z. B. 7.4. vs 07.04.) */
  startsOn: string;
};

/** Mögliche Datumsdarstellungen wie in `document.body.innerText`. */
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

/** UI-Text → freie Plätze (99 = „3+“, Badge zeigt „Verfügbar“). */
export function parseRemainingFromStatusLabel(label: string): number {
  const t = label.trim().toLowerCase();
  if (!t) return 99;
  if (t.includes("leider") && t.includes("ausgebucht")) return 0;
  if (t.includes("ausgebucht") && !t.includes("noch")) return 0;
  const mNum = t.match(/noch\s+(\d+)\s+restplätze?/);
  if (mNum) return Math.max(0, parseInt(mNum[1]!, 10));
  if (/noch\s+1\s+restplatz/.test(t)) return 1;
  if (t.includes("verfügbar")) return 99;
  return 99;
}

export async function scrapeRemainingSpotsFromYogaflowApp(options: {
  appUrl: string;
  email: string;
  password: string;
  courses: CourseKeyForScrape[];
}): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const url = options.appUrl.replace(/\/$/, "");

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1400, height: 900 },
      locale: "de-DE",
    });
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

    await new Promise((r) => setTimeout(r, 5000));
    await page.waitForLoadState("networkidle").catch(() => {});

    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => window.scrollBy(0, 900));
      await new Promise((r) => setTimeout(r, 350));
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 500));

    const pairs = await page.evaluate(
      (expected: { id: string; title: string; dateVariants: string[] }[]) => {
        const statusRe =
          /(noch\s+\d+\s+Restplätze?|noch\s+1\s+Restplatz|Verfügbar|Leider\s+schon\s+ausgebucht)/i;

        function segmentHasAnyDate(seg: string, variants: string[]) {
          return variants.some((v) => v && seg.includes(v));
        }

        function extractStatus(seg: string): string {
          const m = seg.match(statusRe);
          return m ? (m[1] ?? m[0]).trim() : "";
        }

        const out: { id: string; status: string }[] = [];
        const body = (document.body.innerText || "").replace(/\u00a0/g, " ");

        for (const c of expected) {
          const title = c.title.trim();
          const variants = c.dateVariants.filter(Boolean);
          let found = "";

          // 1) Titel-Anker: großes Fenster vor/nach Titel (Datum oft oberhalb der Karte)
          {
            let pos = 0;
            while (pos < body.length) {
              const i = body.indexOf(title, pos);
              if (i === -1) break;
              const start = Math.max(0, i - 900);
              const end = Math.min(body.length, i + 4800);
              const segment = body.slice(start, end);
              if (!segmentHasAnyDate(segment, variants)) {
                pos = i + 1;
                continue;
              }
              found = extractStatus(segment);
              if (found) break;
              pos = i + 1;
            }
          }

          // 2) Datums-Anker: gleicher Titel + Status in lokalem Fenster
          if (!found) {
            outer: for (const dv of variants) {
              let pos = 0;
              while (pos < body.length) {
                const j = body.indexOf(dv, pos);
                if (j === -1) break;
                const start = Math.max(0, j - 1000);
                const end = Math.min(body.length, j + 2200);
                const segment = body.slice(start, end);
                if (segment.includes(title)) {
                  found = extractStatus(segment);
                  if (found) break outer;
                }
                pos = j + 1;
              }
            }
          }

          out.push({ id: c.id, status: found });
        }

        return out;
      },
      options.courses.map((c) => ({
        id: c.id,
        title: c.title,
        dateVariants: dateLabelVariants(c.dayDe, c.startsOn),
      })),
    );

    for (const p of pairs) {
      const n = parseRemainingFromStatusLabel(p.status);
      result.set(p.id, n);
      if (!p.status.trim()) {
        console.warn(
          `Playwright: kein Statustext für Kurs ${p.id} – Fallback „Verfügbar“. Titel/Datum im UI prüfen.`,
        );
      }
    }
  } finally {
    await browser.close();
  }

  return result;
}
