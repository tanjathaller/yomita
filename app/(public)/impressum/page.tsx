import type { Metadata } from "next";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { getSiteContent } from "@/lib/get-site-content";
import { LEGAL_PAGES_NOINDEX } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Impressum",
  alternates: { canonical: "/impressum" },
  robots: LEGAL_PAGES_NOINDEX
    ? { index: false, follow: true }
    : { index: true, follow: true },
};

export default async function ImpressumPage() {
  const content = await getSiteContent();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <MarkdownContent markdown={content.legal.imprintText} />
    </div>
  );
}
