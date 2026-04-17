import {
  extractSiteMediaKeyFromStoredValue,
  isValidSiteMediaKey,
  siteMediaProxyPath,
} from "@/lib/netlify-site-media";

export function resolveImageUrl(url: string): string {
  if (!url) {
    return url;
  }

  const trimmed = url.trim();
  /** Alte Query-URLs → Pfad-URL, damit Browser/CDN nicht alle Bilder zusammenlegen. */
  if (trimmed.startsWith("/api/blob-image?")) {
    try {
      const params = new URLSearchParams(trimmed.split("?")[1] ?? "");
      const key = params.get("key");
      if (key && isValidSiteMediaKey(key)) {
        return siteMediaProxyPath(key);
      }
    } catch {
      /* fall through */
    }
    return trimmed;
  }

  if (trimmed.startsWith("/api/blob-image/")) {
    return trimmed;
  }

  const key = extractSiteMediaKeyFromStoredValue(trimmed);
  if (key) {
    return siteMediaProxyPath(key);
  }

  return url;
}

export function isBlobProxyUrl(url: string): boolean {
  const t = url.trim();
  return t.startsWith("/api/blob-image?") || t.startsWith("/api/blob-image/");
}
