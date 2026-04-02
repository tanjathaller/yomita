import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { yogaflowCoursesFileSchema } from "@/lib/schemas/yogaflow-courses-file";
import type { SiteContent } from "@/types/site-content";

const YOGAFLOW_COURSES_PATH = path.join(
  process.cwd(),
  "data",
  "yogaflow-courses.json",
);

/**
 * Wenn `YOGAFLOW_USE_SYNCED_COURSES=false`, kein Merge.
 * Sonst: gültige `data/yogaflow-courses.json` → `yogaflowCourses` (App-Termine).
 * `courses` bleiben die manuell gepflegten Einträge aus KV/JSON.
 */
export async function mergeYogaflowCoursesIfConfigured(
  content: SiteContent,
): Promise<SiteContent> {
  if (process.env.YOGAFLOW_USE_SYNCED_COURSES === "false") {
    return content;
  }

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
  };
}
