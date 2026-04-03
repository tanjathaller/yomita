import {
  SectionWaveBottom,
  type SectionWaveTarget,
} from "@/components/shared/section-wave";
import { cn } from "@/lib/utils";

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
        "relative scroll-mt-[calc(var(--site-header-clearance-mobile)+0.5rem)] lg:scroll-mt-[calc(var(--site-header-clearance)+0.5rem)]",
        "bg-[var(--surface-muted-band)] pt-2 pb-16 lg:pt-4 lg:pb-24",
      )}
    >
      <div className="relative z-10 mx-auto max-w-6xl px-4 lg:px-8 xl:max-w-7xl xl:px-10">
        <div
          className={cn(
            "relative isolate w-full overflow-hidden rounded-t-3xl rounded-b-2xl lg:rounded-b-3xl",
            "border-0",
            /* Langer Fade: Kartenfläche löst sich unten in dasselbe Band wie die Sektion auf */
            "bg-[linear-gradient(180deg,var(--card)_0%,var(--card)_42%,color-mix(in_oklab,var(--card)_82%,var(--surface-muted-band)_18%)_62%,color-mix(in_oklab,var(--card)_28%,var(--surface-muted-band)_72%)_84%,var(--surface-muted-band)_100%)]",
            "shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(47,59,42,0.07)] motion-reduce:hover:translate-y-0",
          )}
        >
          {/* Weicher Übergang unten inkl. seitlicher Kanten (unter dem Inhalt, analog Hero) */}
          <div
            className="pointer-events-none absolute inset-x-[-1px] bottom-0 z-[1] h-28 border-0 ring-0 lg:h-36"
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
          <div className="relative z-10 p-4 lg:p-6 xl:p-8">
            <div className="mx-auto max-w-3xl text-center lg:max-w-4xl">
              <h2 className="font-heading text-foreground text-balance text-xl font-semibold tracking-tight lg:text-3xl xl:text-4xl">
                Yoga mit Ruhe und Praezision
              </h2>
              <p className="text-foreground/90 mx-auto mt-2 max-w-2xl text-sm leading-relaxed lg:text-base">
                Ausfuehrlicher findest du meinen Weg und meine Haltung im Abschnitt Ueber mich.
              </p>
            </div>
          </div>
        </div>
      </div>
      <SectionWaveBottom from="muted-band" into={waveInto} />
    </section>
  );
}
