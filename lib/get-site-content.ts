import "server-only";

import { filterManualCoursesWhenYogaflowSyncActive } from "@/lib/filter-manual-courses-with-yogaflow";
import { disconnectSiteContentObjectGraph } from "@/lib/site-content-object-graph";
import { readSiteContent } from "@/lib/site-content-store";
import { withSortedLists } from "@/lib/sort-content";
import { mergeYogaflowCoursesIfConfigured } from "@/lib/yogaflow-courses-merge";
import type { SiteContent } from "@/types/site-content";

export async function getSiteContent(): Promise<SiteContent> {
  const content = await readSiteContent();
  const merged = await mergeYogaflowCoursesIfConfigured(content);
  const sorted = withSortedLists(merged);
  const withFilteredCourses = {
    ...sorted,
    courses: filterManualCoursesWhenYogaflowSyncActive(
      sorted.courses,
      sorted.yogaflowCourses,
    ),
  };
  return disconnectSiteContentObjectGraph(withFilteredCourses);
}
