import type {
  Course,
  GeneralSettings,
  InternalCourse,
  YogaflowCourseSeries,
} from "@/types/site-content";
import { isInternalCourse } from "@/types/site-content";

/** Fallback, wenn `settings.yogaflowCourseSeries` fehlt oder leer ist (z. B. älteres KV). */
export const DEFAULT_YOGAFLOW_COURSE_SERIES: YogaflowCourseSeries[] = [
  {
    id: "series-yoga-dienstag",
    sortOrder: 10,
    matchTitles: ["Yoga am Dienstag"],
    displayTitle: "Vinyasa Yoga in Neuss am Dienstag",
    description: "Vinyasa für Fortgeschrittene",
    day: "Dienstag",
    time: "18:00–19:30 (90 Min.)",
    location: "Neuss",
    price: "12,00 €",
    bookingBadgeLabel: "Buchung über die App",
  },
  {
    id: "series-yoga-mittwoch",
    sortOrder: 20,
    matchTitles: ["Yoga am Mittwoch"],
    displayTitle: "Yoga Flow in Neuss am Mittwoch",
    description: "Vinyasa/Hatha für alle",
    day: "Mittwoch",
    time: "18:00–19:30 (90 Min.)",
    location: "Neuss",
    price: "12,00 €",
    bookingBadgeLabel: "Buchung über die App",
  },
];

export function ensureYogaflowCourseSeriesSettings(
  settings: GeneralSettings,
): GeneralSettings {
  const series =
    settings.yogaflowCourseSeries && settings.yogaflowCourseSeries.length > 0
      ? settings.yogaflowCourseSeries
      : DEFAULT_YOGAFLOW_COURSE_SERIES;
  return {
    ...settings,
    yogaflowCourseSeries: [...series].sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export type YogaflowSeriesBlock = {
  series: YogaflowCourseSeries;
  sessions: InternalCourse[];
};

/**
 * Ordnet Sync-Kurse den Serien zu; sortiert Termine nach Datum.
 * Nicht zugeordnete Einträge werden protokolliert (Server).
 */
export function groupYogaflowCoursesIntoSeries(
  seriesConfigs: YogaflowCourseSeries[],
  courses: Course[] | undefined,
): YogaflowSeriesBlock[] {
  const list = courses ?? [];
  const sortedConfigs = [...seriesConfigs].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const titleToSeriesId = new Map<string, string>();
  for (const s of sortedConfigs) {
    for (const raw of s.matchTitles) {
      const t = raw.trim();
      if (t) titleToSeriesId.set(t, s.id);
    }
  }

  const bySeriesId = new Map<string, InternalCourse[]>();
  for (const s of sortedConfigs) {
    bySeriesId.set(s.id, []);
  }

  const unmatched: string[] = [];
  for (const course of list) {
    if (!isInternalCourse(course)) {
      unmatched.push(`(non-internal) ${course.title}`);
      continue;
    }
    const seriesId = titleToSeriesId.get(course.title.trim());
    if (!seriesId) {
      unmatched.push(course.title.trim() || course.id);
      continue;
    }
    bySeriesId.get(seriesId)!.push(course);
  }

  if (unmatched.length > 0) {
    console.warn(
      "[yogaflow] Kurse ohne passende Serie (yogaflowCourseSeries.matchTitles):",
      [...new Set(unmatched)].join(", "),
    );
  }

  for (const sessions of bySeriesId.values()) {
    sessions.sort((a, b) => {
      const da = a.startsOn ?? "";
      const db = b.startsOn ?? "";
      if (da !== db) return da.localeCompare(db);
      return a.sortOrder - b.sortOrder;
    });
  }

  return sortedConfigs.map((series) => ({
    series,
    sessions: bySeriesId.get(series.id) ?? [],
  }));
}
