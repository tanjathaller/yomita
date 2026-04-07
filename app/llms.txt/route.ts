import { NextResponse } from "next/server";

import { readSiteContent } from "@/lib/site-content-store";
import { getSiteUrl } from "@/lib/site-url";

export async function GET() {
  const base = getSiteUrl();
  const content = await readSiteContent();
  const title = content.settings.businessName.trim() || "Öffentliche Website";

  const lines: string[] = [
    `# ${title}`,
    "",
    "> Wegweiser für assistive Systeme (z. B. LLMs und Crawler). Kein Ersatz für die verlinkten Seiten — maßgeblich sind deren Inhalte.",
    "",
  ];

  const meta = content.settings.metaDescription?.trim();
  if (meta) {
    lines.push(`> ${meta}`, "");
  }

  lines.push(
    "## Startseite (One-Pager)",
    `- ${base}/`,
    "- Anker: `#hero`, `#aktuelles` (nur wenn Inhalte vorhanden), `#kurse`, `#preise`, `#ueber-mich`, `#kontakt`.",
    "",
    "## Rechtliches",
    `- ${base}/impressum`,
    `- ${base}/datenschutz`,
    "",
    "## Hinweise zur Website",
    "- Kurs- und Terminübersicht; Buchung für Bestandskund:innen über die in den Inhalten verlinkte App.",
    "- Rückfragen: Kontaktbereich `#kontakt` auf der Startseite.",
    "- Keine Zahlungsabwicklung und kein vollständiges Buchungssystem auf dieser Website.",
    "",
    "## Nicht für die öffentliche Indexierung gedacht",
    "- Bereiche unter `/admin` und `/api/` (siehe robots.txt).",
    "",
    "## Sitemap",
    `- ${base}/sitemap.xml`,
    "",
  );

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
