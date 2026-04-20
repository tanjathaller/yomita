import type { Course, SiteContent, YogaflowCourseSeries } from "@/types/site-content";

const WEEKDAY_ORDER = [
  "montag",
  "dienstag",
  "mittwoch",
  "donnerstag",
  "freitag",
  "samstag",
  "sonntag",
] as const;

function normalizeDayValue(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .trim();
}

/** Wochentag-Index (0 = Montag …); ohne erkennbaren Wochentag → sehr groß. */
export function getWeekdaySortIndex(dayRaw: string): number {
  const day = normalizeDayValue(dayRaw);
  if (!day) {
    return Number.MAX_SAFE_INTEGER;
  }

  const direct = WEEKDAY_ORDER.findIndex((weekday) => day.includes(weekday));
  if (direct >= 0) {
    return direct;
  }

  const shortMatches: Array<{ token: string; index: number }> = [
    { token: "mo", index: 0 },
    { token: "di", index: 1 },
    { token: "mi", index: 2 },
    { token: "do", index: 3 },
    { token: "fr", index: 4 },
    { token: "sa", index: 5 },
    { token: "so", index: 6 },
  ];
  for (const { token, index } of shortMatches) {
    if (new RegExp(`\\b${token}\\b`, "i").test(day)) {
      return index;
    }
  }
  return Number.MAX_SAFE_INTEGER;
}

/** Erste Startzeit aus Freitext (z. B. „18:00–19:30“) als Minuten seit Mitternacht; sonst MAX_SAFE_INTEGER. */
export function parseSessionTimeForSort(timeRaw: string): number {
  const m = timeRaw.trim().match(/(\d{1,2}):(\d{2})/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const h = Number.parseInt(m[1]!, 10);
  const min = Number.parseInt(m[2]!, 10);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return Number.MAX_SAFE_INTEGER;
  return h * 60 + min;
}

export type LegacyCourseGridEntry =
  | {
      kind: "series";
      series: YogaflowCourseSeries;
      /** Index innerhalb der Serien-Liste (wie früher `index` in `seriesBlocks.map`). */
      indexInKind: number;
    }
  | {
      kind: "manual";
      course: Course;
      /** Index innerhalb der manuellen Kurse (wie früher `index` in `manualCourses.map`). */
      indexInKind: number;
    };

/** Exakt die frühere Sortierung aus `CoursesSection` (Wochentag → day-String → Index in Teilliste). */
export function compareLegacyCourseGridOrder(
  a: LegacyCourseGridEntry,
  b: LegacyCourseGridEntry,
): number {
  const dayA = a.kind === "series" ? a.series.day : a.course.day;
  const dayB = b.kind === "series" ? b.series.day : b.course.day;
  const weekdayA = getWeekdaySortIndex(dayA);
  const weekdayB = getWeekdaySortIndex(dayB);
  if (weekdayA !== weekdayB) return weekdayA - weekdayB;
  const byDay = dayA.localeCompare(dayB, "de", { sensitivity: "base" });
  if (byDay !== 0) return byDay;
  return a.indexInKind - b.indexInKind;
}

const COURSE_GRID_SORT_VERSION = 2 as const;

function buildLegacyEntries(content: SiteContent): LegacyCourseGridEntry[] {
  const series = [...(content.settings.yogaflowCourseSeries ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const courses = [...content.courses].sort((a, b) => a.sortOrder - b.sortOrder);
  const out: LegacyCourseGridEntry[] = [];
  series.forEach((s, indexInKind) => {
    out.push({ kind: "series", series: s, indexInKind });
  });
  courses.forEach((c, indexInKind) => {
    out.push({ kind: "manual", course: c, indexInKind });
  });
  return out;
}

/**
 * Einmalige Migration: eindeutige `sortOrder` für Serien + manuelle Kurse wie bisherige Wochentag-Raster-Reihenfolge.
 */
export function applyCourseGridSortV2IfNeeded(content: SiteContent): SiteContent {
  if (content.settings.courseGridSortVersion === COURSE_GRID_SORT_VERSION) {
    return content;
  }

  const legacySorted = [...buildLegacyEntries(content)].sort(compareLegacyCourseGridOrder);
  let order = 10;
  const nextOrder = () => {
    const v = order;
    order += 10;
    return v;
  };

  const seriesById = new Map(
    (content.settings.yogaflowCourseSeries ?? []).map((s) => [s.id, { ...s }]),
  );
  const coursesById = new Map(content.courses.map((c) => [c.id, { ...c }]));

  for (const entry of legacySorted) {
    if (entry.kind === "series") {
      const row = seriesById.get(entry.series.id);
      if (row) row.sortOrder = nextOrder();
    } else {
      const row = coursesById.get(entry.course.id);
      if (row) row.sortOrder = nextOrder();
    }
  }

  return {
    ...content,
    settings: {
      ...content.settings,
      yogaflowCourseSeries: content.settings.yogaflowCourseSeries?.length
        ? [...(content.settings.yogaflowCourseSeries ?? [])].map(
            (s) => seriesById.get(s.id) ?? s,
          )
        : content.settings.yogaflowCourseSeries,
      courseGridSortVersion: COURSE_GRID_SORT_VERSION,
    },
    courses: content.courses.map((c) => coursesById.get(c.id) ?? c),
  };
}

export type CourseGridDraftSlice = {
  settings: Pick<SiteContent["settings"], "yogaflowCourseSeries">;
  courses: Course[];
};

type SortableGridRow =
  | { kind: "series"; series: YogaflowCourseSeries; id: string }
  | { kind: "manual"; course: Course; id: string };

function toRows(draft: CourseGridDraftSlice): SortableGridRow[] {
  const series = [...(draft.settings.yogaflowCourseSeries ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const courses = [...draft.courses].sort((a, b) => a.sortOrder - b.sortOrder);
  return [
    ...series.map((series) => ({ kind: "series" as const, series, id: series.id })),
    ...courses.map((course) => ({ kind: "manual" as const, course, id: course.id })),
  ];
}

/**
 * Admin: nach erstem Setzen eines Wochentags — Karten mit erkanntem Wochentag oben (Tag + Uhrzeit),
 * ohne Wochentag unten; danach durchgehende sortOrder 10, 20, …
 */
export function realignCourseGridSortOrdersByWeekday(draft: CourseGridDraftSlice): CourseGridDraftSlice {
  const rows = toRows(draft);
  const hasWeekday = (r: SortableGridRow) => {
    const day = r.kind === "series" ? r.series.day : r.course.day;
    return getWeekdaySortIndex(day) < Number.MAX_SAFE_INTEGER;
  };

  const sorted = [...rows].sort((a, b) => {
    const wA = hasWeekday(a) ? 0 : 1;
    const wB = hasWeekday(b) ? 0 : 1;
    if (wA !== wB) return wA - wB;

    const dayA = a.kind === "series" ? a.series.day : a.course.day;
    const dayB = b.kind === "series" ? b.series.day : b.course.day;
    const weekdayA = getWeekdaySortIndex(dayA);
    const weekdayB = getWeekdaySortIndex(dayB);
    if (weekdayA !== weekdayB) return weekdayA - weekdayB;

    const timeA = a.kind === "series" ? a.series.time : a.course.time;
    const timeB = b.kind === "series" ? b.series.time : b.course.time;
    const tA = parseSessionTimeForSort(timeA);
    const tB = parseSessionTimeForSort(timeB);
    if (tA !== tB) return tA - tB;

    const oA = a.kind === "series" ? a.series.sortOrder : a.course.sortOrder;
    const oB = b.kind === "series" ? b.series.sortOrder : b.course.sortOrder;
    if (oA !== oB) return oA - oB;
    return a.id.localeCompare(b.id);
  });

  let next = 10;
  const seriesById = new Map(
    (draft.settings.yogaflowCourseSeries ?? []).map((s) => [s.id, { ...s }]),
  );
  const coursesById = new Map(draft.courses.map((c) => [c.id, { ...c }]));

  for (const r of sorted) {
    if (r.kind === "series") {
      const row = seriesById.get(r.series.id);
      if (row) row.sortOrder = next;
    } else {
      const row = coursesById.get(r.course.id);
      if (row) row.sortOrder = next;
    }
    next += 10;
  }

  return {
    settings: {
      ...draft.settings,
      yogaflowCourseSeries: draft.settings.yogaflowCourseSeries?.length
        ? [...(draft.settings.yogaflowCourseSeries ?? [])].map(
            (s) => seriesById.get(s.id) ?? s,
          )
        : draft.settings.yogaflowCourseSeries,
    },
    courses: draft.courses.map((c) => coursesById.get(c.id) ?? c),
  };
}
