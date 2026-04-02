/**
 * Öffnet die YogaFlow-Web-App, loggt ein und liest Verfügbarkeitstexte aus dem sichtbaren DOM
 * (gleiche Sicht wie im Browser). Kein Zugriff auf registrations in Supabase nötig.
 */

import { chromium } from "playwright";

export type CourseKeyForScrape = {
  id: string;
  title: string;
  dayDe: string;
};

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
      (expected: { id: string; title: string; dayDe: string }[]) => {
        const statusRe =
          /(noch\s+\d+\s+Restplätze?|noch\s+1\s+Restplatz|Verfügbar|Leider\s+schon\s+ausgebucht)/i;
        const out: { id: string; status: string }[] = [];
        const body = document.body.innerText || "";

        for (const c of expected) {
          const title = c.title.trim();
          const dayDe = c.dayDe.trim();
          let found = "";
          let pos = 0;

          while (pos < body.length) {
            const i = body.indexOf(title, pos);
            if (i === -1) break;
            const segment = body.slice(i, i + Math.min(1000, body.length - i));
            if (!segment.includes(dayDe)) {
              pos = i + 1;
              continue;
            }
            const fromDate = segment.slice(segment.indexOf(dayDe));
            const m = fromDate.match(statusRe);
            found = m ? m[1]!.trim() : "";
            break;
          }

          out.push({ id: c.id, status: found });
        }

        return out;
      },
      options.courses.map((c) => ({
        id: c.id,
        title: c.title,
        dayDe: c.dayDe,
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
