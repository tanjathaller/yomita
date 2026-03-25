import { ArrowRight } from "lucide-react";

import {
  SectionWaveBottom,
  type SectionWaveTarget,
} from "@/components/shared/section-wave";
import {
  buttonTrailingArrowClassName,
  buttonVariants,
} from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const ctaClassName = cn(
  buttonVariants({ variant: "secondary", size: "lg" }),
  "min-h-11 gap-2 px-5 text-base font-semibold sm:min-h-12 sm:px-6 sm:text-[1.05rem]",
);

type AboutTeaserSectionProps = {
  /**
   * Füllfarbe der Welle = Hintergrund des **nächsten** Blocks.
   * Mit `background` (wenn darunter Aktuelles auf Seitenfläche folgt) wie Kurse→Preise sichtbar; sonst `muted-band`.
   */
  waveInto?: SectionWaveTarget;
};

/**
 * Mini-Teaser unter dem Hero (Muted-Band, kein zweites Bild). Unten langer Farbverlauf Karte → Band (kein harter Schnitt).
 * Inhalt grob an `about` in `SiteContent` halten; bei stärkeren Textänderungen dort mitziehen.
 */
export function AboutTeaserSection({
  waveInto = "muted-band",
}: AboutTeaserSectionProps) {
  return (
    <section
      className={cn(
        "relative scroll-mt-[calc(var(--site-header-clearance-mobile)+0.5rem)] sm:scroll-mt-[calc(var(--site-header-clearance)+0.5rem)]",
        "bg-[var(--surface-muted-band)] pt-3 pb-24 sm:pt-4 sm:pb-28 md:pt-5 md:pb-32",
      )}
    >
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative isolate w-full overflow-hidden rounded-t-3xl rounded-b-2xl sm:rounded-b-3xl",
            "border-0",
            /* Langer Fade: Kartenfläche löst sich unten in dasselbe Band wie die Sektion auf */
            "bg-[linear-gradient(180deg,var(--card)_0%,var(--card)_42%,color-mix(in_oklab,var(--card)_82%,var(--surface-muted-band)_18%)_62%,color-mix(in_oklab,var(--card)_28%,var(--surface-muted-band)_72%)_84%,var(--surface-muted-band)_100%)]",
            "shadow-[0_2px_20px_rgba(0,0,0,0.04)]",
          )}
        >
          {/* Weicher Übergang unten inkl. seitlicher Kanten (unter dem Inhalt, analog Hero) */}
          <div
            className="pointer-events-none absolute inset-x-[-1px] bottom-0 z-[1] h-28 border-0 ring-0 sm:h-32 md:h-36"
            style={{
              /* Erste Schicht = oben: Ecken weicher; darunter linearer Fade über die volle Breite */
              background: [
                "radial-gradient(ellipse 72% 95% at 0% 100%, color-mix(in oklab, var(--surface-muted-band) 70%, transparent), transparent 62%)",
                "radial-gradient(ellipse 72% 95% at 100% 100%, color-mix(in oklab, var(--surface-muted-band) 70%, transparent), transparent 62%)",
                "linear-gradient(to bottom, transparent 0%, color-mix(in oklab, var(--surface-muted-band) 18%, transparent) 28%, color-mix(in oklab, var(--surface-muted-band) 48%, transparent) 48%, var(--surface-muted-band) 76%, var(--surface-muted-band) 100%)",
              ].join(", "),
            }}
            aria-hidden
          />
          <div className="relative z-10 p-5 sm:p-7 lg:p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-stretch md:gap-8 lg:gap-10">
              <header className="flex flex-col text-center md:col-span-5 md:h-full md:text-left">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-[0.7rem] font-medium tracking-[0.18em] uppercase sm:text-xs">
                    Ein paar Worte von mir
                  </p>
                  <h2 className="font-heading text-foreground text-balance text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[2rem] lg:leading-snug">
                    Yoga mit Ruhe und Präzision
                  </h2>
                </div>
                <div className="hidden md:mt-auto md:block md:pt-8">
                  <a href="#ueber-mich" className={cn(ctaClassName, "w-fit")}>
                    Mehr über mich
                    <ArrowRight
                      className={cn(buttonTrailingArrowClassName, "size-[1.05rem]")}
                      aria-hidden
                    />
                  </a>
                </div>
              </header>

              <div className="text-center md:col-span-7 md:text-left">
                <p className="text-foreground mx-auto max-w-xl text-base leading-relaxed font-medium md:mx-0 md:max-w-lg sm:text-[1.05rem] sm:leading-relaxed">
                  Ich bin Tanja. Kurz gesagt: Yoga mit Ruhe, Atem und Raum für dich – wer ich bin und
                  wie ich zu dieser Praxis stehe, erzähle ich gleich unten bei{" "}
                  <span className="text-foreground whitespace-nowrap">Über mich</span>.
                </p>
              </div>

              <div className="flex justify-center md:hidden">
                <a href="#ueber-mich" className={ctaClassName}>
                  Mehr über mich
                  <ArrowRight
                    className={cn(buttonTrailingArrowClassName, "size-[1.05rem]")}
                    aria-hidden
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SectionWaveBottom from="muted-band" into={waveInto} />
    </section>
  );
}
