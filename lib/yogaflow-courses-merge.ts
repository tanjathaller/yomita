import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { yogaflowCoursesFileSchema } from "@/lib/schemas/yogaflow-courses-file";
import { getYogaflowRemoteCoursesPayload } from "@/lib/yogaflow-remote-courses";
import type { SiteContent } from "@/types/site-content";

const YOGAFLOW_COURSES_PATH = path.join(
  process.cwd(),
  "data",
  "yogaflow-courses.json",
);

function stripYogaflowMeta(content: SiteContent): SiteContent {
  const {
    yogaflowSyncedAt: _s,
    yogaflowCoursesLoadError: _e,
    ...rest
  } = content;
  return rest;
}

async function mergeFromLocalFile(content: SiteContent): Promise<SiteContent> {
  let raw: string;
  try {
    raw = await readFile(YOGAFLOW_COURSES_PATH, "utf-8");
  } catch {
    return content;
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return content;
  }

  const parsed = yogaflowCoursesFileSchema.safeParse(json);
  if (!parsed.success || !parsed.data.syncedAt.trim()) {
    return content;
  }

  return {
    ...content,
    yogaflowCourses: parsed.data.courses,
    yogaflowSyncedAt: parsed.data.syncedAt.trim(),
    yogaflowCoursesLoadError: false,
  };
}

/**
 * Wenn `YOGAFLOW_USE_SYNCED_COURSES=false`, kein Merge.
 * Sonst, mit Priorität:
 * 1. `NEXT_PUBLIC_YOGAFLOW_DATA_URL` → Fetch pro Request (`cache: no-store`), Zod-Validierung.
 * 2. Sonst Fallback: `data/yogaflow-courses.json` (lokal / Übergang).
 * `courses` bleiben die manuell gepflegten Einträge aus KV/JSON.
 */
export async function mergeYogaflowCoursesIfConfigured(
  content: SiteContent,
): Promise<SiteContent> {
  if (process.env.YOGAFLOW_USE_SYNCED_COURSES === "false") {
    return stripYogaflowMeta(content);
  }

  const base = stripYogaflowMeta(content);
  const remote = await getYogaflowRemoteCoursesPayload();

  if (remote.status === "no_remote_url") {
    return mergeFromLocalFile(base);
  }

  if (remote.status === "error") {
    console.warn(
      `[YogaFlow] Remote-Kursdaten nicht ladbar: ${remote.message}`,
    );
    return {
      ...base,
      yogaflowCoursesLoadError: true,
    };
  }

  return {
    ...base,
    yogaflowCourses: remote.courses,
    yogaflowSyncedAt: remote.syncedAt,
    yogaflowCoursesLoadError: false,
  };
}
