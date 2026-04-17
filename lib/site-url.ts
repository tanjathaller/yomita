/**
 * Zentrale öffentliche Site-URL für Canonicals, robots.txt, sitemap.xml und /llms.txt.
 *
 * Live: `NEXT_PUBLIC_SITE_URL` in Netlify (Production) bzw. früher Vercel und optional
 * lokal in `.env.local` setzen (ohne trailing slash). Fallbacks: `VERCEL_URL`,
 * Netlify `DEPLOY_PRIME_URL` / `URL`, sonst localhost.
 */
export const LEGAL_PAGES_NOINDEX = false;

function normalizeHttpsBase(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, "");
  }
  return `https://${trimmed.replace(/\/$/, "")}`;
}

export function getSiteUrl(): string {
  const explicit = normalizeHttpsBase(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) {
    return explicit;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  const netlifyPrime = normalizeHttpsBase(process.env.DEPLOY_PRIME_URL);
  if (netlifyPrime) return netlifyPrime;

  const netlifyUrl = normalizeHttpsBase(process.env.URL);
  if (netlifyUrl) return netlifyUrl;

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
