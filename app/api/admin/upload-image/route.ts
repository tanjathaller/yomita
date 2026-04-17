import { randomUUID } from "node:crypto";

import type { Store } from "@netlify/blobs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-auth-constants";
import { isAdminSessionTokenValid } from "@/lib/admin-auth";
import { getSiteMediaStore, siteMediaProxyPath } from "@/lib/netlify-site-media";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function sanitizeFilename(filename: string): string {
  return filename.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

    if (!isAdminSessionTokenValid(sessionToken)) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const scopeRaw = formData.get("scope");
    const blobPrefix =
      scopeRaw === "about"
        ? "about"
        : scopeRaw === "og"
          ? "og"
          : scopeRaw === "hero"
            ? "hero"
            : scopeRaw === "logo"
              ? "logo"
              : scopeRaw === "favicon"
                ? "favicon"
                : scopeRaw === "aktuelles" || scopeRaw === null || scopeRaw === ""
                  ? "aktuelles"
                  : null;

    if (blobPrefix === null) {
      return NextResponse.json(
        {
          error:
            "Ungueltiger Upload-Bereich (scope). Erlaubt: aktuelles, about, og, hero, logo, favicon.",
        },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Keine Datei uebergeben." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Nur JPG, PNG oder WEBP sind erlaubt." }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Datei ist zu gross (max. 5 MB)." }, { status: 400 });
    }

    const safeName = sanitizeFilename(file.name || "image.webp");
    const key = `${blobPrefix}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeName}`;

    let store: Store;
    try {
      store = getSiteMediaStore();
    } catch {
      return NextResponse.json(
        {
          error:
            "Netlify Blobs nicht erreichbar. Auf Netlify deployen oder lokal NETLIFY_SITE_ID und NETLIFY_AUTH_TOKEN (PAT mit Blobs) in .env.local setzen.",
        },
        { status: 500 },
      );
    }
    await store.set(key, file, {
      metadata: { contentType: file.type },
    });

    return NextResponse.json({ url: siteMediaProxyPath(key) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Upload-Fehler.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
