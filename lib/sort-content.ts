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
  return {
    ...content,
    settings: ensureYogaflowCourseSeriesSettings(content.settings),
    aktuell: {
      ...content.aktuell,
      items: sortAktuellesItems(content.aktuell.items),
    },
    courses: sortCourses(content.courses),
    yogaflowCourses: content.yogaflowCourses?.length
      ? sortCourses(content.yogaflowCourses)
      : content.yogaflowCourses,
    prices: sortPrices(content.prices),
  };
}
