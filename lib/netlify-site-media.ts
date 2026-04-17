import { getStore, type Store } from "@netlify/blobs";

/** Netlify Blobs store name (site-wide, über Deploys hinweg). */
export const SITE_MEDIA_STORE_NAME = "site-media";

const MEDIA_KEY_PATTERN = /^[a-zA-Z0-9._\-/]+$/;

export function isValidSiteMediaKey(key: string): boolean {
  if (!key || key.length > 500 || key.includes("..") || !MEDIA_KEY_PATTERN.test(key)) {
    return false;
  }
  return true;
}

/**
 * Liefert den Store: auf Netlify mit injiziertem Kontext, lokal mit
 * `NETLIFY_SITE_ID` + `NETLIFY_AUTH_TOKEN` (Personal Access Token mit Blobs-Zugriff).
 */
export function getSiteMediaStore(): Store {
  const siteID = process.env.NETLIFY_SITE_ID?.trim();
  const token = process.env.NETLIFY_AUTH_TOKEN?.trim();
  if (siteID && token) {
    return getStore(SITE_MEDIA_STORE_NAME, {
      siteID,
      token,
      consistency: "strong",
    });
  }
  return getStore(SITE_MEDIA_STORE_NAME, { consistency: "strong" });
}

export function siteMediaProxyPath(key: string): string {
  return `/api/blob-image?key=${encodeURIComponent(key)}`;
}

export function extractSiteMediaKeyFromStoredValue(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/api/blob-image?")) {
    try {
      const params = new URLSearchParams(trimmed.split("?")[1] ?? "");
      const key = params.get("key");
      return key && isValidSiteMediaKey(key) ? key : null;
    } catch {
      return null;
    }
  }

  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname.endsWith(".private.blob.vercel-storage.com")) {
      return null;
    }
    const key = parsed.pathname.replace(/^\//, "");
    return key && isValidSiteMediaKey(key) ? key : null;
  } catch {
    return null;
  }
}

export async function getSiteMediaStreamWithContentType(
  key: string,
): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null> {
  if (!isValidSiteMediaKey(key)) {
    return null;
  }

  const store = getSiteMediaStore();
  const result = await store.getWithMetadata(key, { type: "stream", consistency: "strong" });
  if (!result?.data) {
    return null;
  }

  const meta = result.metadata?.contentType;
  const contentType = typeof meta === "string" && meta.length > 0 ? meta : "application/octet-stream";

  return { stream: result.data, contentType };
}
