export function resolveImageUrl(url: string): string {
  if (!url) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const isPrivateBlobHost = parsed.hostname.endsWith(".private.blob.vercel-storage.com");
    if (!isPrivateBlobHost) {
      return url;
    }

    // `download=1` URLs are meant for file download; for <img> we want the raw blob URL.
    parsed.search = "";
    return `/api/blob-image?src=${encodeURIComponent(parsed.toString())}`;
  } catch {
    return url;
  }
}

export function isBlobProxyUrl(url: string): boolean {
  return url.startsWith("/api/blob-image?src=");
}
