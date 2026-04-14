import type { PriceItem } from "@/types/site-content";

import { PriceCard } from "@/components/domain/price-card";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { SectionShell } from "@/components/shared/section-shell";
import { cn } from "@/lib/utils";

type PricesSectionProps = {
  prices: PriceItem[];
  /** Kleines Label über der Headline (z. B. „Teilnahme“). */
  eyebrowLabel?: string;
  /** Optionaler Sektionstitel (Fallback: „Preise“). */
  sectionTitle?: string;
  /** Optionaler Absatz unter dem Titel (Markdown). */
  sectionIntro?: string;
};

const DEFAULT_PRICES_INTRO_MARKDOWN =
  "Zahlung und Abwicklung erfolgen außerhalb dieser Website (z. B. vor Ort oder per Rechnung) – hier nur die Übersicht.";

export function PricesSection({ prices, eyebrowLabel, sectionTitle, sectionIntro }: PricesSectionProps) {
  const eyebrow = eyebrowLabel?.trim();
  const heading = sectionTitle?.trim() || "Preise";
  const introMarkdown = sectionIntro?.trim() || DEFAULT_PRICES_INTRO_MARKDOWN;
  return (
    <SectionShell
      className="pb-24 lg:pb-34 bg-[linear-gradient(to_bottom,var(--background)_0%,var(--background)_70%,color-mix(in_oklab,var(--background)_78%,var(--surface-muted-band)_22%)_84%,color-mix(in_oklab,var(--background)_48%,var(--surface-muted-band)_52%)_94%,var(--surface-muted-band)_100%)]"
    >
      <div className="max-w-2xl pl-4 lg:pl-6">
        <div
          id="preise"
          className={cn("anchor-header-tight", "relative inline-block pr-6 lg:pr-7")}
        >
          {eyebrow ? (
            <p className="mb-2 ml-1 text-xs font-semibold tracking-[0.18em] text-[#7A956E] uppercase lg:text-sm">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-[#2F3B2A] text-5xl font-semibold tracking-tight lg:text-6xl">
            {heading}
          </h2>
          <span
            aria-hidden
            className="mt-2 ml-3 block h-1 w-28 rounded-full bg-[#6F8B63]"
          />
        </div>
      </div>
      <div className="mt-4 max-w-2xl pl-4 lg:pl-6">
        <MarkdownContent
          markdown={introMarkdown}
          className={cn(
            "max-w-prose text-muted-foreground [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground lg:[&_p]:text-base",
            "[&_a]:text-primary [&_a]:font-medium [&_a]:underline-offset-4 hover:[&_a]:underline",
          )}
        />
      </div>
      <div
        className={cn(
          "mt-10 flex flex-col gap-5",
          /* Flex + zentrierte letzte Zeile(n), gleiche Kartenbreite wie früher 3-Spalten-Grid (nur lg+) */
          "lg:flex-row lg:flex-wrap lg:justify-center lg:gap-6 xl:gap-8",
        )}
      >
        {prices.map((p) => (
          <div
            key={p.id}
            className={cn(
              "flex min-w-0 w-full flex-col",
              /* flex-basis statt nur width: zuverlässig gleich breite Spalten im Flex-Wrap */
              "lg:flex-[0_0_calc((100%_-_3rem)/3)]",
              "xl:flex-[0_0_calc((100%_-_4rem)/3)]",
            )}
          >
            <PriceCard item={p} />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
