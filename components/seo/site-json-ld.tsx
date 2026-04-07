import { buildSiteJsonLd } from "@/lib/json-ld";
import type { SiteContent } from "@/types/site-content";

export function SiteJsonLd({ content }: { content: SiteContent }) {
  const graph = buildSiteJsonLd(content);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
