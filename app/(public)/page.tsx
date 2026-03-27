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
        waveInto={hasAktuelles ? undefined : "muted-band"}
      />
      <HeroSeamDebug />
      <AktuellesSection aktuell={content.aktuell} afterAboutTeaser={hasAktuelles} />
      <CoursesSection
        courses={content.courses}
        appUrl={content.settings.appUrl}
        afterAktuelles={hasAktuelles}
        afterAboutTeaser={false}
      />
      <PricesSection prices={content.prices} />
      <AboutSection about={content.about} />
      <ContactSection contact={content.contact} />
    </>
  );
}
