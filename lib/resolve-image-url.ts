import { extractSiteMediaKeyFromStoredValue, siteMediaProxyPath } from "@/lib/netlify-site-media";

export function resolveImageUrl(url: string): string {
  if (!url) {
    return url;
  }

  const trimmed = url.trim();
  if (trimmed.startsWith("/api/blob-image?")) {
    return trimmed;
  }

  const key = extractSiteMediaKeyFromStoredValue(trimmed);
  if (key) {
    return siteMediaProxyPath(key);
  }

  return url;
}

export function isBlobProxyUrl(url: string): boolean {
  return url.startsWith("/api/blob-image?");
}
