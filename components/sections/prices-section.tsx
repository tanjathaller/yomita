import type { PriceItem } from "@/types/site-content";

import { PriceCard } from "@/components/domain/price-card";
import { SectionShell } from "@/components/shared/section-shell";

type PricesSectionProps = {
  prices: PriceItem[];
};

export function PricesSection({ prices }: PricesSectionProps) {
  return (
    <SectionShell id="preise" waveInto="muted-band" className="-mt-px">
      <div className="max-w-2xl pl-4 sm:pl-6">
        <div className="relative inline-block pr-6 sm:pr-7">
          <p className="mb-2 ml-1 text-xs font-semibold tracking-[0.18em] text-[#7A956E] uppercase sm:text-sm">
            Investition
          </p>
          <h2 className="text-[#2F3B2A] text-5xl font-semibold tracking-tight sm:text-6xl">
            Meine Angebote
          </h2>
          <span
            aria-hidden
            className="mt-2 ml-3 block h-1 w-28 rounded-full bg-border/80"
          />
        </div>
      </div>
      <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
        Zahlung und Abwicklung erfolgen außerhalb dieser Website (z. B. vor Ort oder per Rechnung)
        – hier nur die Übersicht.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
        {prices.map((p) => (
          <PriceCard key={p.id} item={p} />
        ))}
      </div>
    </SectionShell>
  );
}
