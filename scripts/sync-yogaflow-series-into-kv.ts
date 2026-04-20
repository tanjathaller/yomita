/**
 * Nach `sync:yogaflow` / `publish:yogaflow`: fehlende `yogaflowCourseSeries` aus
 * `data/yogaflow-courses.json` in Redis (`site:content`) ergänzen (idempotent).
 * Entfernt `yogaflow-auto-*`-Serien, wenn kein `matchTitles`-Titel mehr in der Sync-JSON vorkommt.
 *
 * Env (ein Paar nötig): KV_REST_API_URL + KV_REST_API_TOKEN oder
 * UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (oder yomita_*-Alias).
 * Fehlt Redis: Hinweis, Exit 0.
 *
 * Lokal: `node --import tsx --env-file=.env.local scripts/sync-yogaflow-series-into-kv.ts`
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import { Redis } from "@upstash/redis";

import { applyCourseGridSortV2IfNeeded } from "../lib/course-grid-sort";
import { ensureYogaflowCourseSeriesSettings } from "../lib/yogaflow-series-group";
import yogaflowCoursesFileSchema from "../lib/schemas/yogaflow-courses-file";
import { siteContentSchema } from "../lib/schemas/site-content";
import { disconnectSiteContentObjectGraph, disconnectUnknownJsonTree } from "../lib/site-content-object-graph";
import type {
  Course,
  InternalCourse,
  SiteContent,
  YogaflowCourseSeries,
} from "../types/site-content";
import { isInternalCourse } from "../types/site-content";

const SITE_CONTENT_KV_KEY = "site:content";
const MAX_YOGAFLOW_SERIES = 25;

function redisFromEnv(): Redis | null {
  const url =
    process.env.KV_REST_API_URL?.trim() ||
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.yomita_KV_REST_API_URL?.trim();
  const token =
    process.env.KV_REST_API_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.yomita_KV_REST_API_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function slugifyForId(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return base.length > 0 ? base : "kurs";
}

function uniqueSeriesId(baseSlug: string, existingIds: Set<string>): string {
  let id = `yogaflow-auto-${baseSlug}`;
  let n = 2;
  while (existingIds.has(id)) {
    id = `yogaflow-auto-${baseSlug}-${n}`;
    n += 1;
  }
  existingIds.add(id);
  return id;
}

function coveredMatchTitles(series: YogaflowCourseSeries[] | undefined): Set<string> {
  const s = new Set<string>();
  for (const row of series ?? []) {
    for (const t of row.matchTitles) {
      const k = t.trim();
      if (k) s.add(k);
    }
  }
  return s;
}

function earliestSessionForTitle(courses: Course[], title: string): InternalCourse | undefined {
  const t = title.trim();
  const list = courses.filter(isInternalCourse).filter((c) => c.title.trim() === t);
  if (!list.length) return undefined;
  return [...list].sort((a, b) => {
    const da = a.startsOn ?? "";
    const db = b.startsOn ?? "";
    if (da !== db) return da.localeCompare(db);
    return a.sortOrder - b.sortOrder;
  })[0];
}

function maxGridSortOrderForSeriesAndCourses(
  series: YogaflowCourseSeries[],
  courses: Course[],
): number {
  let m = 0;
  for (const s of series) {
    m = Math.max(m, s.sortOrder);
  }
  for (const c of courses) {
    m = Math.max(m, c.sortOrder);
  }
  return m;
}

async function main(): Promise<void> {
  const redis = redisFromEnv();
  if (!redis) {
    console.warn(
      "[sync-yogaflow-series-into-kv] Keine Redis/KV-URL+Token – übersprungen (KV_REST_* oder UPSTASH_REDIS_* setzen).",
    );
    return;
  }

  const rawKv = await redis.get(SITE_CONTENT_KV_KEY);
  if (rawKv === null || rawKv === undefined) {
    console.warn(
      `[sync-yogaflow-series-into-kv] Redis-Key ${SITE_CONTENT_KV_KEY} fehlt – nichts zu mergen.`,
    );
    return;
  }

  const normalized: unknown =
    typeof rawKv === "string" ? JSON.parse(rawKv) : disconnectUnknownJsonTree(rawKv);
  let content = disconnectSiteContentObjectGraph(
    siteContentSchema.parse(normalized),
  );
  content = {
    ...content,
    settings: ensureYogaflowCourseSeriesSettings(content.settings),
  };
  content = applyCourseGridSortV2IfNeeded(content);

  const yogaflowPath = path.join(process.cwd(), "data", "yogaflow-courses.json");
  const yogaflowRaw = await readFile(yogaflowPath, "utf-8");
  const yogaflowJson: unknown = JSON.parse(yogaflowRaw);
  const yogaflowPayload = yogaflowCoursesFileSchema.parse(yogaflowJson);

  let seriesList = [...(content.settings.yogaflowCourseSeries ?? [])];
  const internalTitles = new Set<string>();
  for (const c of yogaflowPayload.courses) {
    if (!isInternalCourse(c)) continue;
    const t = c.title.trim();
    if (t) internalTitles.add(t);
  }

  const beforePrune = seriesList.length;
  seriesList = seriesList.filter((s) => {
    if (!s.id.startsWith("yogaflow-auto-")) return true;
    return s.matchTitles.some((t) => internalTitles.has(t.trim()));
  });
  const pruned = beforePrune - seriesList.length;
  if (pruned > 0) {
    console.log(
      `[sync-yogaflow-series-into-kv] ${pruned} Auto-Serie(n) entfernt (kein passender App-Kurstitel mehr in der Sync-JSON).`,
    );
  }

  const covered = coveredMatchTitles(seriesList);
  const missingTitles = [...internalTitles].filter((t) => !covered.has(t)).sort((a, b) =>
    a.localeCompare(b, "de"),
  );

  let added = 0;
  if (missingTitles.length > 0) {
    const existingIds = new Set(seriesList.map((s) => s.id));
    const room = MAX_YOGAFLOW_SERIES - seriesList.length;
    if (room <= 0) {
      console.warn(
        `[sync-yogaflow-series-into-kv] Serien-Limit (${MAX_YOGAFLOW_SERIES}) – ${missingTitles.length} neue Titel nicht angelegt.`,
      );
    } else {
      const toAdd = missingTitles.slice(0, room);
      if (toAdd.length < missingTitles.length) {
        console.warn(
          `[sync-yogaflow-series-into-kv] Nur ${toAdd.length}/${missingTitles.length} neue Serien (Limit Platz ${room}).`,
        );
      }
      const baseOrder = maxGridSortOrderForSeriesAndCourses(seriesList, content.courses);
      toAdd.forEach((title, i) => {
        const first = earliestSessionForTitle(yogaflowPayload.courses, title);
        const slug = slugifyForId(title);
        const id = uniqueSeriesId(slug, existingIds);
        const row: YogaflowCourseSeries = {
          id,
          sortOrder: baseOrder + 10 * (i + 1),
          matchTitles: [title],
          displayTitle: title,
          description: (first?.description ?? "").trim(),
          day: "",
          time: (first?.time ?? "").trim(),
          location: (first?.location ?? "").trim(),
          price: first?.price,
          bookingBadgeLabel: "Buchung über die App",
        };
        seriesList.push(row);
        added += 1;
      });
    }
  }

  content = {
    ...content,
    settings: {
      ...content.settings,
      yogaflowCourseSeries: seriesList,
    },
  };

  const parsed = siteContentSchema.parse(content);
  const toWrite = disconnectSiteContentObjectGraph(parsed);
  await redis.set(SITE_CONTENT_KV_KEY, toWrite);

  if (added > 0 || pruned > 0) {
    console.log(
      `[sync-yogaflow-series-into-kv] OK: +${added} Serie(n), −${pruned} Auto-Serie(n); KV aktualisiert.`,
    );
  } else {
    console.log("[sync-yogaflow-series-into-kv] Keine Serien-Änderung – KV normalisiert (v2).");
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
