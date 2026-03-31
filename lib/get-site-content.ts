import "server-only";

import { readSiteContent } from "@/lib/site-content-store";
import { withSortedLists } from "@/lib/sort-content";
import type { SiteContent } from "@/types/site-content";

export async function getSiteContent(): Promise<SiteContent> {
  const content = await readSiteContent();
  return withSortedLists(content);
}
