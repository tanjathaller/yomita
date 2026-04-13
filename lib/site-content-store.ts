import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { Redis } from "@upstash/redis";

import { siteContentSchema } from "@/lib/schemas/site-content";
import type { SiteContent } from "@/types/site-content";

const SITE_CONTENT_KV_KEY = "site:content";
const SITE_CONTENT_FILE_PATH = path.join(process.cwd(), "data", "site-content.json");

const kvRestUrl =
  process.env.KV_REST_API_URL ??
  process.env.UPSTASH_REDIS_REST_URL ??
  process.env.yomita_KV_REST_API_URL;
const kvRestToken =
  process.env.KV_REST_API_TOKEN ??
  process.env.UPSTASH_REDIS_REST_TOKEN ??
  process.env.yomita_KV_REST_API_TOKEN;
const redisClient =
  kvRestUrl && kvRestToken ? new Redis({ url: kvRestUrl, token: kvRestToken }) : null;

function hasRedisConfig(): boolean {
  return Boolean(redisClient);
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
  if (!hasRedisConfig()) {
    return readSiteContentFromFile();
  }

  const record = await redisClient!.get<unknown>(SITE_CONTENT_KV_KEY);
  if (!record) {
    const fallback = await readSiteContentFromFile();
    await redisClient!.set(SITE_CONTENT_KV_KEY, fallback);
    return fallback;
  }

  return siteContentSchema.parse(record);
}

export async function saveSiteContent(content: SiteContent): Promise<SiteContent> {
  const parsed = siteContentSchema.parse(content);
  if (hasRedisConfig()) {
    await redisClient!.set(SITE_CONTENT_KV_KEY, parsed);
    return parsed;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "KV/Redis REST-Variablen fehlen in Production (KV_REST_* oder UPSTASH_REDIS_REST_* oder yomita_KV_REST_*). Speichern in Datei ist dort nicht verfuegbar.",
    );
  }

  await writeSiteContentToFile(parsed);
  return parsed;
}

export async function seedSiteContentFromFileToKv(): Promise<SiteContent> {
  if (!hasRedisConfig()) {
    throw new Error(
      "KV/Redis REST-Variablen fehlen (KV_REST_* oder UPSTASH_REDIS_REST_* oder yomita_KV_REST_*).",
    );
  }

  const parsed = await readSiteContentFromFile();
  await redisClient!.set(SITE_CONTENT_KV_KEY, parsed);
  return parsed;
}
