/**
 * Zentrale öffentliche Site-URL für Canonicals, robots.txt und sitemap.xml.
 *
 * Später IONOS-Domain: in Vercel (Production/Preview) und optional lokal in
 * `.env.local` `NEXT_PUBLIC_SITE_URL` setzen, z. B. https://www.example.de
 * (ohne trailing slash). Bei Custom Domain auf Vercel unbedingt setzen —
 * `VERCEL_URL` bleibt oft die *.vercel.app-Adresse.
 */
export const LEGAL_PAGES_NOINDEX = false;

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}

/**
 * Wandelt eine Asset-URL aus dem Content in eine absolute URL um (Schema.org, JSON-LD).
 * Bereits absolute http(s)-URLs bleiben unverändert.
 */
export function toAbsoluteSiteUrl(resourceUrl: string | undefined): string | undefined {
  const trimmed = resourceUrl?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = getSiteUrl();
  try {
    const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return new URL(path, `${base}/`).href;
  } catch {
    return undefined;
  }
}
