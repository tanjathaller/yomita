import type { Metadata } from "next";

import { getSiteContent } from "@/lib/get-site-content";
import { AboutSection } from "@/components/sections/about-section";
import { AktuellesSection } from "@/components/sections/aktuell-section";
import { ContactSection } from "@/components/sections/contact-section";
import { CoursesSection } from "@/components/sections/courses-section";
import { HeroSection } from "@/components/sections/hero-section";
import { PricesSection } from "@/components/sections/prices-section";
import { HeroSeamDebug } from "@/components/debug/hero-seam-debug";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
  };
}

export default async function HomePage() {
  const content = await getSiteContent();
  const hasAktuelles = content.aktuell.items.length > 0;
  const heroEyebrowEnabled = content.settings.heroEyebrowEnabled !== false;
  const aktuellEyebrowEnabled = content.settings.aktuellEyebrowEnabled !== false;
  const coursesEyebrowEnabled = content.settings.coursesEyebrowEnabled !== false;
  const pricesEyebrowEnabled = content.settings.pricesEyebrowEnabled !== false;

  return (
    <>
      <HeroSection
        hero={content.hero}
        businessName={heroEyebrowEnabled ? content.settings.businessName : undefined}
        eyebrowLabel={heroEyebrowEnabled ? content.settings.sectionEyebrows?.hero : undefined}
        waveInto={hasAktuelles ? undefined : "muted-band"}
      />
      <HeroSeamDebug />
      <AktuellesSection
        aktuell={content.aktuell}
        afterAboutTeaser={hasAktuelles}
        eyebrowLabel={aktuellEyebrowEnabled ? content.settings.sectionEyebrows?.aktuell : undefined}
      />
      <CoursesSection
        yogaflowCourses={content.yogaflowCourses ?? []}
        yogaflowCourseSeries={content.settings.yogaflowCourseSeries ?? []}
        manualCourses={content.courses}
        appUrl={content.settings.appUrl}
        eyebrowLabel={coursesEyebrowEnabled ? content.settings.sectionEyebrows?.courses : undefined}
        sectionTitle={content.settings.coursesSectionTitle}
        sectionIntro={content.settings.coursesSectionIntro}
        appButtonLabel={content.settings.coursesSectionAppButtonLabel}
        afterAktuelles={hasAktuelles}
        afterAboutTeaser={false}
        yogaflowSyncedAt={content.yogaflowSyncedAt}
        yogaflowCoursesLoadError={content.yogaflowCoursesLoadError}
      />
      <PricesSection
        prices={content.prices}
        eyebrowLabel={pricesEyebrowEnabled ? content.settings.sectionEyebrows?.prices : undefined}
        sectionTitle={content.settings.pricesSectionTitle}
        sectionIntro={content.settings.pricesSectionIntro}
      />
      <AboutSection about={content.about} />
      <ContactSection contact={content.contact} />
    </>
  );
}
