import type { NextResponse } from "next/server";

import { siteMediaBlobGetResponse } from "@/lib/blob-image-response";

type RouteParams = { segments?: string[] };

export async function GET(
  _request: Request,
  context: { params: Promise<RouteParams> },
): Promise<NextResponse> {
  const { segments } = await context.params;
  if (!segments?.length) {
    return siteMediaBlobGetResponse("");
  }
  const key = segments.join("/");
  return siteMediaBlobGetResponse(key);
}
