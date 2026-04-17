import type { SiteContent } from "@/types/site-content";

/**
 * Tiefenkopie wie beim KV-Serialisieren (`JSON.stringify`): garantiert keine
 * geteilten Objekt-Referenzen mehr (Hero, Aktuelles, Logo, About, …).
 *
 * Hintergrund: React Flight (RSC→Client) und manche Deserialisierer können
 * identische Subtrees referenzidentisch machen; ein Logo-URL-Update würde dann
 * fälschlich auch andere Felder „mitziehen“.
 */
export function disconnectSiteContentObjectGraph(content: SiteContent): SiteContent {
  return JSON.parse(JSON.stringify(content)) as SiteContent;
}

/** Rohtext aus Datei/Redis vor `siteContentSchema.parse` — gleiche Referenz-Entkopplung. */
export function disconnectUnknownJsonTree(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
}
