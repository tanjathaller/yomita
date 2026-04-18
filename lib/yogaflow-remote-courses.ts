import "server-only";

import { cache } from "react";

import { yogaflowCoursesFileSchema } from "@/lib/schemas/yogaflow-courses-file";
import type { Course } from "@/types/site-content";

const FETCH_TIMEOUT_MS = 12_000;

export type YogaflowRemoteCoursesResult =
  | { status: "no_remote_url" }
  | { status: "ok"; syncedAt: string; courses: Course[] }
  | { status: "error"; message: string };

/**
 * Öffentliche JSON-URL (Netlify / .env.local). Nur http(s); sonst wird Remote-Laden übersprungen.
 */
function normalizeYogaflowDataUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_YOGAFLOW_DATA_URL?.trim();
  if (!raw) return null;
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(raw);
  } catch {
    return null;
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return null;
  }
  return parsedUrl.href;
}

async function fetchRemoteOnce(url: string): Promise<YogaflowRemoteCoursesResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return {
        status: "error",
        message: `HTTP ${res.status}: ${res.statusText}`,
      };
    }
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return { status: "error", message: "Antwort ist kein gültiges JSON." };
    }
    const parsed = yogaflowCoursesFileSchema.safeParse(json);
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      };
    }
    if (!parsed.data.syncedAt.trim()) {
      return { status: "error", message: "syncedAt fehlt oder ist leer." };
    }
    return {
      status: "ok",
      syncedAt: parsed.data.syncedAt.trim(),
      courses: parsed.data.courses,
    };
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.name === "AbortError"
          ? `Timeout nach ${FETCH_TIMEOUT_MS / 1000}s`
          : e.message
        : String(e);
    return { status: "error", message: msg };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Pro Request höchstens ein HTTP-Fetch (Layout + Page + Metadata teilen sich den Aufruf).
 */
export const getYogaflowRemoteCoursesPayload = cache(
  async (): Promise<YogaflowRemoteCoursesResult> => {
    const url = normalizeYogaflowDataUrl();
    if (!url) return { status: "no_remote_url" };
    return fetchRemoteOnce(url);
  },
);
