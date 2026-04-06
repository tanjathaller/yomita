import type { Course } from "@/types/site-content";

/** Sync-Ort aus der App ist oft „Gagelweg“; manuelle Duplikate nennen häufig „Neuss“. */
const NEUSS_APP_STUDIO = /neuss|gagelweg/i;

/**
 * Entfernt manuelle `courses`, die dieselben Neuss-Slots abdecken wie die YogaFlow-Serien
 * (Dienstag/Mittwoch), falls im KV noch Altbestand aus der Zeit vor den Serien-Karten liegt.
 * Admin (`readSiteContent`) bleibt unangetastet.
 */
export function filterManualCoursesWhenYogaflowSyncActive(
  manualCourses: Course[],
  yogaflowCourses: Course[] | undefined,
): Course[] {
  if (!yogaflowCourses?.length) return manualCourses;

  return manualCourses.filter((course) => {
    const day = course.day.trim().toLowerCase();
    const loc = course.location.trim();
    const isNeussWeeklySlot =
      (day === "dienstag" || day === "mittwoch") &&
      NEUSS_APP_STUDIO.test(loc);
    return !isNeussWeeklySlot;
  });
}
