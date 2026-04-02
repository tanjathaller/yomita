import { randomUUID } from "node:crypto";

import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-auth-constants";
import { isAdminSessionTokenValid } from "@/lib/admin-auth";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function sanitizeFilename(filename: string): string {
  return filename.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
}

type UploadedBlobResult = {
  url: string;
};

async function uploadImageToBlob(key: string, file: File): Promise<UploadedBlobResult> {
  try {
    return (await put(key, file, { access: "public" })) as UploadedBlobResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.toLowerCase().includes("private store")) {
      throw error;
    }

    // Fallback for projects where the Blob store is configured as private.
    return (await put(key, file, { access: "private" })) as UploadedBlobResult;
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

    if (!isAdminSessionTokenValid(sessionToken)) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN fehlt. Upload ist nicht konfiguriert." },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const scopeRaw = formData.get("scope");
    const blobPrefix =
      scopeRaw === "about"
        ? "about"
        : scopeRaw === "aktuelles" || scopeRaw === null || scopeRaw === ""
          ? "aktuelles"
          : null;

    if (blobPrefix === null) {
      return NextResponse.json(
        { error: "Ungueltiger Upload-Bereich (scope). Erlaubt: aktuelles, about." },
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
    const uploaded = await uploadImageToBlob(key, file);
    const imageUrl = uploaded.url;

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Upload-Fehler.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
