import { applyCourseGridSortV2IfNeeded } from "@/lib/course-grid-sort";
import { ensureYogaflowCourseSeriesSettings } from "@/lib/yogaflow-series-group";
import type {
  AktuellesItem,
  Course,
  PriceItem,
  SiteContent,
} from "@/types/site-content";

export function sortAktuellesItems(items: AktuellesItem[]): AktuellesItem[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function sortCourses(courses: Course[]): Course[] {
  return [...courses].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function sortPrices(prices: PriceItem[]): PriceItem[] {
  return [...prices].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function withSortedLists(content: SiteContent): SiteContent {
  const migrated = applyCourseGridSortV2IfNeeded({
    ...content,
    settings: ensureYogaflowCourseSeriesSettings(content.settings),
  });
  return {
    ...migrated,
    settings: migrated.settings,
    aktuell: {
      ...migrated.aktuell,
      items: sortAktuellesItems(migrated.aktuell.items),
    },
    courses: sortCourses(migrated.courses),
    yogaflowCourses: migrated.yogaflowCourses?.length
      ? sortCourses(migrated.yogaflowCourses)
      : migrated.yogaflowCourses,
    prices: sortPrices(migrated.prices),
  };
}
