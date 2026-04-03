import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipToContentLink } from "@/components/layout/skip-to-content-link";
import { getSiteContent } from "@/lib/get-site-content";

/** `site-content.json` bei jedem Request neu lesen (ohne erneuten `next build`). */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const name = content.settings.businessName;
  const defaultTitle = content.settings.siteTitle ?? name;
  return {
    title: {
      default: defaultTitle,
      template: `%s | ${name}`,
    },
    description: content.settings.metaDescription ?? undefined,
    openGraph: content.settings.ogImageUrl
      ? { images: [{ url: content.settings.ogImageUrl }] }
      : undefined,
  };
}

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = await getSiteContent();

  return (
    <>
      <SkipToContentLink />
      <SiteHeader
        settings={content.settings}
        hasAktuellesItems={content.aktuell.items.length > 0}
      />
      <main
        id="main-content"
        className="relative z-0 isolate flex-1 bg-[var(--surface-muted-band)] pt-[var(--site-header-clearance-mobile)] lg:pt-[var(--site-header-clearance)]"
      >
        {children}
      </main>
      <SiteFooter settings={content.settings} />
    </>
  );
}
