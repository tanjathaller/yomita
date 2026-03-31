import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { kv } from "@vercel/kv";

import { siteContentSchema } from "@/lib/schemas/site-content";
import type { SiteContent } from "@/types/site-content";

const SITE_CONTENT_KV_KEY = "site:content";
const SITE_CONTENT_FILE_PATH = path.join(process.cwd(), "data", "site-content.json");

function hasKvConfig(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function readSiteContentFromFile(): Promise<SiteContent> {
  const raw = await readFile(SITE_CONTENT_FILE_PATH, "utf-8");
  const json: unknown = JSON.parse(raw);
  return siteContentSchema.parse(json);
}

async function writeSiteContentToFile(content: SiteContent): Promise<void> {
  const serialized = `${JSON.stringify(content, null, 2)}\n`;
  await writeFile(SITE_CONTENT_FILE_PATH, serialized, "utf-8");
}

export async function readSiteContent(): Promise<SiteContent> {
  if (!hasKvConfig()) {
    return readSiteContentFromFile();
  }

  const record = await kv.get<unknown>(SITE_CONTENT_KV_KEY);
  if (!record) {
    const fallback = await readSiteContentFromFile();
    await kv.set(SITE_CONTENT_KV_KEY, fallback);
    return fallback;
  }

  return siteContentSchema.parse(record);
}

export async function saveSiteContent(content: SiteContent): Promise<SiteContent> {
  const parsed = siteContentSchema.parse(content);
  if (hasKvConfig()) {
    await kv.set(SITE_CONTENT_KV_KEY, parsed);
    return parsed;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "KV_REST_API_URL/KV_REST_API_TOKEN fehlen in Production. Speichern in Datei ist dort nicht verfuegbar.",
    );
  }

  await writeSiteContentToFile(parsed);
  return parsed;
}

export async function seedSiteContentFromFileToKv(): Promise<SiteContent> {
  if (!hasKvConfig()) {
    throw new Error("KV_REST_API_URL und KV_REST_API_TOKEN sind nicht gesetzt.");
  }

  const parsed = await readSiteContentFromFile();
  await kv.set(SITE_CONTENT_KV_KEY, parsed);
  return parsed;
}
