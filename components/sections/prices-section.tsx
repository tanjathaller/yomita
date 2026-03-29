import type { PriceItem } from "@/types/site-content";

import { PriceCard } from "@/components/domain/price-card";
import { SectionShell } from "@/components/shared/section-shell";

type PricesSectionProps = {
  prices: PriceItem[];
};

export function PricesSection({ prices }: PricesSectionProps) {
  return (
    <SectionShell
      id="preise"
      className="pb-24 lg:pb-34 bg-[linear-gradient(to_bottom,var(--background)_0%,var(--background)_70%,color-mix(in_oklab,var(--background)_78%,var(--surface-muted-band)_22%)_84%,color-mix(in_oklab,var(--background)_48%,var(--surface-muted-band)_52%)_94%,var(--surface-muted-band)_100%)]"
    >
      <div className="max-w-2xl pl-4 lg:pl-6">
        <div className="relative inline-block pr-6 lg:pr-7">
          <p className="mb-2 ml-1 text-xs font-semibold tracking-[0.18em] text-[#7A956E] uppercase lg:text-sm">
            Teilnahme
          </p>
          <h2 className="text-[#2F3B2A] text-5xl font-semibold tracking-tight lg:text-6xl">
            Preise
          </h2>
          <span
            aria-hidden
            className="mt-2 ml-3 block h-1 w-28 rounded-full bg-[#6F8B63]"
          />
        </div>
      </div>
      <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed lg:text-base">
        Zahlung und Abwicklung erfolgen außerhalb dieser Website (z. B. vor Ort oder per Rechnung)
        – hier nur die Übersicht.
      </p>
      <div className="mt-10 grid gap-5 lg:grid-cols-3 lg:gap-6 xl:gap-8">
        {prices.map((p) => (
          <PriceCard key={p.id} item={p} />
        ))}
      </div>
    </SectionShell>
  );
}
