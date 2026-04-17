import { NextResponse } from "next/server";

import { siteMediaBlobGetResponse } from "@/lib/blob-image-response";

/** Legacy: `?key=…` — bleibt für alte gespeicherte URLs; neue URLs nutzen `/api/blob-image/{key}`. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { error: "Query-Parameter 'key' fehlt (Netlify Blobs Objektschlüssel)." },
      { status: 400 },
    );
  }

  return siteMediaBlobGetResponse(key);
}
