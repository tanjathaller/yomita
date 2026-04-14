import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getSiteContent } from "@/lib/get-site-content";

export const dynamic = "force-dynamic";

const CACHE_HEADER = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400";

type BlobGetResult = {
  stream?: ReadableStream<Uint8Array> | (() => ReadableStream<Uint8Array>);
  contentType?: string;
} | null;

async function streamPrivateBlob(url: string): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new NextResponse(null, { status: 500 });
  }

  const blob = (await get(url, { access: "private" })) as BlobGetResult;
  if (!blob) {
    return new NextResponse(null, { status: 404 });
  }

  const stream = typeof blob.stream === "function" ? blob.stream() : blob.stream;
  if (!stream) {
    return new NextResponse(null, { status: 502 });
  }

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": blob.contentType || "image/webp",
      "Cache-Control": CACHE_HEADER,
    },
  });
}

export async function GET() {
  const content = await getSiteContent();
  const raw = content.settings.faviconUrl?.trim();
  if (!raw) {
    return new NextResponse(null, { status: 404 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (parsed.hostname.endsWith(".private.blob.vercel-storage.com")) {
    return streamPrivateBlob(parsed.toString());
  }

  if (parsed.protocol === "http:" || parsed.protocol === "https:") {
    try {
      const upstream = await fetch(parsed.toString());
      if (!upstream.ok) {
        return new NextResponse(null, { status: 502 });
      }
      const contentType = upstream.headers.get("content-type") || "application/octet-stream";
      const body = upstream.body;
      if (!body) {
        return new NextResponse(null, { status: 502 });
      }
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": CACHE_HEADER,
        },
      });
    } catch {
      return new NextResponse(null, { status: 502 });
    }
  }

  return new NextResponse(null, { status: 400 });
}
