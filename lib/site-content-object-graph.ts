import type { SiteContent } from "@/types/site-content";

/**
 * Tiefenkopie von `SiteContent`, damit nirgends dieselbe Objekt-Referenz
 * in mehreren logischen Feldern hängt (z. B. Hero, Aktuelles, Logo, About).
 *
 * Hintergrund: React Flight kann beim RSC→Client-Transport referenzidentische
 * Subtrees zusammenführen; bearbeitbare Client-State darf diese Referenzen nicht
 * „mitverändern“. Zusätzlich schützt das Lesen aus Stores vor seltenen
 * referenzgeteilten Deserialisaten.
 */
export function disconnectSiteContentObjectGraph(content: SiteContent): SiteContent {
  return structuredClone(content);
}
