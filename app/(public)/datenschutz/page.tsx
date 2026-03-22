import type { Metadata } from "next";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { getSiteContent } from "@/lib/get-site-content";

export const metadata: Metadata = {
  title: "Datenschutz",
};

export default async function DatenschutzPage() {
  const content = await getSiteContent();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <MarkdownContent markdown={content.legal.privacyText} />
    </div>
  );
}
