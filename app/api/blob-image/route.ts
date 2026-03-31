import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
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

  try {
    const blob = (await get(parsedUrl.toString(), { access: "private" })) as
      | {
          stream?: ReadableStream<Uint8Array> | (() => ReadableStream<Uint8Array>);
          contentType?: string;
        }
      | null;
    if (!blob) {
      return NextResponse.json({ error: "Bild nicht gefunden." }, { status: 404 });
    }

    const stream = typeof blob.stream === "function" ? blob.stream() : blob.stream;
    if (!stream) {
      return NextResponse.json({ error: "Blob-Stream ist leer." }, { status: 502 });
    }

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": blob.contentType || "image/webp",
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Private Bildauslieferung fehlgeschlagen.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
