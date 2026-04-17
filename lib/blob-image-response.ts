import "server-only";

import { NextResponse } from "next/server";

import { getSiteMediaStreamWithContentType, isValidSiteMediaKey } from "@/lib/netlify-site-media";

/**
 * Liefert das Blob als HTTP-Response.
 * Pfad-URLs (`/api/blob-image/scope/…`) sind CDN-sicher; Query-URLs (`?key=`) können
 * auf manchen CDNs fälschlich nur nach `/api/blob-image` gecacht werden → überall dasselbe Bild.
 */
export async function siteMediaBlobGetResponse(key: string): Promise<NextResponse> {
  if (!isValidSiteMediaKey(key)) {
    return NextResponse.json({ error: "Ungueltiger Medien-Schluessel." }, { status: 400 });
  }

  try {
    const media = await getSiteMediaStreamWithContentType(key);
    if (!media) {
      return NextResponse.json({ error: "Bild nicht gefunden." }, { status: 404 });
    }

    return new NextResponse(media.stream, {
      status: 200,
      headers: {
        "Content-Type": media.contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bildauslieferung fehlgeschlagen.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
