import "server-only";

import { readSiteContent } from "@/lib/site-content-store";
import { withSortedLists } from "@/lib/sort-content";
import { mergeYogaflowCoursesIfConfigured } from "@/lib/yogaflow-courses-merge";
import type { SiteContent } from "@/types/site-content";

export async function getSiteContent(): Promise<SiteContent> {
  const content = await readSiteContent();
  const merged = await mergeYogaflowCoursesIfConfigured(content);
  return withSortedLists(merged);
}
