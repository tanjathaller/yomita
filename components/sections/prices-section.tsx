import type { PriceItem } from "@/types/site-content";

import { PriceCard } from "@/components/domain/price-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionShell } from "@/components/shared/section-shell";

type PricesSectionProps = {
  prices: PriceItem[];
};

export function PricesSection({ prices }: PricesSectionProps) {
  return (
    <SectionShell id="preise" waveInto="muted-band" className="-mt-px">
      <SectionHeading eyebrow="Investition" title="Preise" className="max-w-2xl" />
      <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
        Zahlung und Abwicklung erfolgen außerhalb dieser Website (z. B. vor Ort oder in der App)
        – hier nur die Übersicht. [Platzhalter]
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
        {prices.map((p) => (
          <PriceCard key={p.id} item={p} />
        ))}
      </div>
    </SectionShell>
  );
}
