import { getSiteContent } from "@/lib/get-site-content";
import { AboutTeaserSection } from "@/components/sections/about-teaser-section";
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
      />
      <HeroSeamDebug />
      <AboutTeaserSection
        waveInto={hasAktuelles ? "background" : "muted-band"}
      />
      <AktuellesSection aktuell={content.aktuell} afterAboutTeaser={hasAktuelles} />
      <CoursesSection
        courses={content.courses}
        afterAktuelles={hasAktuelles}
        afterAboutTeaser={!hasAktuelles}
      />
      <PricesSection prices={content.prices} />
      <AboutSection about={content.about} />
      <ContactSection contact={content.contact} />
    </>
  );
}
