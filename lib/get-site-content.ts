import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { cache } from "react";

import { siteContentSchema } from "@/lib/schemas/site-content";
import { withSortedLists } from "@/lib/sort-content";
import type { SiteContent } from "@/types/site-content";

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const filePath = path.join(process.cwd(), "data", "site-content.json");
  const raw = await readFile(filePath, "utf-8");
  const json: unknown = JSON.parse(raw);
  const parsed = siteContentSchema.parse(json);
  return withSortedLists(parsed satisfies SiteContent);
});
