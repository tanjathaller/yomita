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

    return `/api/blob-image?src=${encodeURIComponent(url)}`;
  } catch {
    return url;
  }
}

export function isBlobProxyUrl(url: string): boolean {
  return url.startsWith("/api/blob-image?src=");
}
