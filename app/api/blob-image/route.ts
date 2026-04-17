import { NextResponse } from "next/server";

import { getSiteMediaStreamWithContentType, isValidSiteMediaKey } from "@/lib/netlify-site-media";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { error: "Query-Parameter 'key' fehlt (Netlify Blobs Objektschlüssel)." },
      { status: 400 },
    );
  }

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
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bildauslieferung fehlgeschlagen.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
