import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return [
    { url: `${base}/`, lastModified },
    { url: `${base}/impressum`, lastModified },
    { url: `${base}/datenschutz`, lastModified },
  ];
}
