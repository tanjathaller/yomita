import { NextResponse } from "next/server";

import { getSiteContent } from "@/lib/get-site-content";
import { extractSiteMediaKeyFromStoredValue, getSiteMediaStreamWithContentType } from "@/lib/netlify-site-media";

export const dynamic = "force-dynamic";

const CACHE_HEADER = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400";

export async function GET() {
  const content = await getSiteContent();
  const raw = content.settings.faviconUrl?.trim();
  if (!raw) {
    return new NextResponse(null, { status: 404 });
  }

  const blobKey = extractSiteMediaKeyFromStoredValue(raw);
  if (blobKey) {
    try {
      const media = await getSiteMediaStreamWithContentType(blobKey);
      if (!media) {
        return new NextResponse(null, { status: 404 });
      }
      return new NextResponse(media.stream, {
        status: 200,
        headers: {
          "Content-Type": media.contentType,
          "Cache-Control": CACHE_HEADER,
        },
      });
    } catch {
      return new NextResponse(null, { status: 502 });
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
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
