import { getSiteContent } from "@/lib/get-site-content";
import { AboutSection } from "@/components/sections/about-section";
import { AktuellesSection } from "@/components/sections/aktuell-section";
import { ContactSection } from "@/components/sections/contact-section";
import { CoursesSection } from "@/components/sections/courses-section";
import { HeroSection } from "@/components/sections/hero-section";
import { PricesSection } from "@/components/sections/prices-section";
import { HeroSeamDebug } from "@/components/debug/hero-seam-debug";

export default async function HomePage() {
  const content = await getSiteContent();
  const hasAktuelles = content.aktuell.items.length > 0;

  return (
    <>
      <HeroSection
        hero={content.hero}
        businessName={content.settings.businessName}
        eyebrowLabel={content.settings.sectionEyebrows?.hero}
        waveInto={hasAktuelles ? undefined : "muted-band"}
      />
      <HeroSeamDebug />
      <AktuellesSection
        aktuell={content.aktuell}
        afterAboutTeaser={hasAktuelles}
        eyebrowLabel={content.settings.sectionEyebrows?.aktuell}
      />
      <CoursesSection
        yogaflowCourses={content.yogaflowCourses ?? []}
        yogaflowCourseSeries={content.settings.yogaflowCourseSeries ?? []}
        manualCourses={content.courses}
        appUrl={content.settings.appUrl}
        eyebrowLabel={content.settings.sectionEyebrows?.courses}
        sectionTitle={content.settings.coursesSectionTitle}
        sectionIntro={content.settings.coursesSectionIntro}
        afterAktuelles={hasAktuelles}
        afterAboutTeaser={false}
      />
      <PricesSection
        prices={content.prices}
        eyebrowLabel={content.settings.sectionEyebrows?.prices}
        sectionTitle={content.settings.pricesSectionTitle}
        sectionIntro={content.settings.pricesSectionIntro}
      />
      <AboutSection about={content.about} />
      <ContactSection contact={content.contact} />
    </>
  );
}
