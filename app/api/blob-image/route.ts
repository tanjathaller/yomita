import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN fehlt. Private Bildauslieferung ist nicht konfiguriert." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src");
  if (!src) {
    return NextResponse.json({ error: "Query-Parameter 'src' fehlt." }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(src);
  } catch {
    return NextResponse.json({ error: "Ungueltige Bild-URL." }, { status: 400 });
  }

  if (!parsedUrl.hostname.endsWith(".private.blob.vercel-storage.com")) {
    return NextResponse.json({ error: "Nur private Blob-URLs sind erlaubt." }, { status: 400 });
  }

  const upstream = await fetch(parsedUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: `Bild konnte nicht geladen werden (HTTP ${upstream.status}).` }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/webp",
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
