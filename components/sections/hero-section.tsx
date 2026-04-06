import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { HeroSection as HeroModel } from "@/types/site-content";

import { HeroAsideStrip } from "@/components/sections/hero-aside-strip";
import { ResponsiveSiteImage } from "@/components/shared/responsive-site-image";
import { SectionWaveBottom } from "@/components/shared/section-wave";
import {
  buttonTrailingArrowClassName,
  buttonVariants,
} from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/** Kleine organische Linie neben der Hero-Eyebrow (nur Desktop, auf dunklem Kartenfeld). */
function HeroEyebrowFlourish({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-2.5 w-[3.25rem] shrink-0 text-primary-foreground/45", className)}
      viewBox="0 0 52 10"
      fill="none"
      aria-hidden
    >
      <path
        d="M1 5.5c6.5-2.8 13.2 2.4 20 1.2 6.5-1.1 12.8-3.8 19.5-2.6 3.8.7 7.5 2.4 11.5 2.8"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Helle Wellenlinien über dem unteren Bildbereich (nur Desktop). */
function HeroPhotoWaves({ className }: { className?: string }) {
  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-[8%] z-[4] h-[32%] min-h-[4.5rem] text-primary-foreground/95",
        className,
      )}
      viewBox="0 0 400 120"
      fill="none"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden
    >
      <path
        d="M-20 88 C 60 72 100 104 180 90 C 260 76 300 98 420 82"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        opacity={0.92}
      />
      <path
        d="M-10 102 C 70 118 130 78 210 96 C 290 114 340 84 430 100"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        opacity={0.72}
      />
    </svg>
  );
}

type HeroSectionProps = {
  hero: HeroModel;
  /** Erscheint als dezente Zeile über der Headline (z. B. Marken- oder Studioname). */
  businessName?: string;
  /** Optionales explizites Hero-Label. Falls leer, wird `businessName` verwendet. */
  eyebrowLabel?: string;
  /** Surface-Farbe der folgenden Sektion für sauberen Wave-Übergang. */
  waveInto?: "background" | "muted-band" | "muted-footer";
};

export function HeroSection({
  hero,
  businessName,
  eyebrowLabel,
  waveInto,
}: HeroSectionProps) {
  const eyebrow = eyebrowLabel?.trim() || businessName?.trim();
  return (
    <section
      id="hero"
      className="relative scroll-mt-[calc(var(--site-header-clearance-mobile)+0.5rem)] bg-[var(--surface-muted-band)] pb-16 lg:scroll-mt-[calc(var(--site-header-clearance)+0.5rem)] lg:pb-12 xl:pb-14"
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden lg:block"
        aria-hidden
      >
        <div className="absolute -left-[18%] top-[6%] h-[min(28rem,48vh)] w-[min(34rem,48vw)] rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--primary)_10%,transparent)_0%,transparent_72%)] opacity-75 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl bg-[var(--surface-muted-band)] px-4 pt-0 pb-0 lg:bg-transparent lg:px-8 lg:pt-3 xl:max-w-7xl xl:px-10 xl:pt-4">
        <div
          data-hero-shell
          className={cn(
            "relative w-full overflow-hidden rounded-t-3xl rounded-b-none border-0 bg-[var(--surface-muted-band)] shadow-none outline-none ring-0",
            "lg:flex lg:items-start lg:justify-start lg:gap-0 lg:overflow-visible lg:rounded-none lg:bg-transparent lg:py-4 xl:py-5",
          )}
        >
          {/* Text: mobil Overlay; Desktop = Primary-Block inkl. schmalem rechten Steg (gleiche Höhe), Bild direkt anschließend */}
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end lg:pointer-events-auto lg:relative lg:inset-auto lg:z-20 lg:min-w-0 lg:flex-1 lg:justify-start lg:self-start lg:py-0">
            <div
              data-hero-primary-card
              className={cn(
                "max-w-2xl space-y-4 p-6",
                "lg:flex lg:w-full lg:max-w-none lg:items-stretch lg:gap-0 lg:space-y-0 lg:overflow-hidden lg:rounded-l-2xl lg:rounded-r-none lg:bg-primary lg:p-0 lg:shadow-[0_20px_48px_-24px_rgba(25,38,26,0.5)]",
                "xl:rounded-l-[1.35rem] xl:rounded-r-none",
              )}
            >
              <div className="space-y-4 lg:flex-1 lg:min-w-0 lg:space-y-5 lg:p-8 lg:pr-7 lg:text-primary-foreground xl:space-y-6 xl:p-9 xl:pr-8">
                {eyebrow ? (
                <div className="lg:flex lg:items-center lg:gap-3">
                  <HeroEyebrowFlourish className="hidden lg:block" />
                  <p
                    className={cn(
                      "font-heading text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/75 drop-shadow-[0_1px_12px_rgba(0,0,0,0.45)] lg:text-xs",
                      "lg:text-primary-foreground/70 lg:drop-shadow-none",
                    )}
                  >
                    {eyebrow}
                  </p>
                </div>
              ) : null}
              <h1
                className={cn(
                  "font-heading text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white drop-shadow-[0_2px_28px_rgba(0,0,0,0.45)] lg:text-6xl xl:text-[3.55rem]",
                  "lg:max-w-[min(100%,17rem)] lg:text-pretty lg:drop-shadow-none lg:leading-[1.08] lg:tracking-[-0.025em] lg:text-primary-foreground",
                  "xl:max-w-[min(100%,19.5rem)] xl:leading-[1.06]",
                  "lg:[font-family:var(--font-hero-display),ui-serif,Georgia,serif] lg:font-semibold",
                )}
              >
                {hero.title.split("\n").map((line, index) => (
                  <Fragment key={index}>
                    {index > 0 ? <br /> : null}
                    <span className="lg:inline-block lg:whitespace-nowrap">
                      {line}
                    </span>
                  </Fragment>
                ))}
              </h1>
              <p
                className={cn(
                  "max-w-xl text-pretty text-lg leading-relaxed text-white/95 drop-shadow-[0_1px_16px_rgba(0,0,0,0.4)] lg:text-[1.125rem] lg:leading-relaxed xl:text-[1.2rem] xl:leading-relaxed",
                  "lg:border-l-2 lg:border-primary-foreground/25 lg:pl-5 lg:text-primary-foreground/88 lg:drop-shadow-none",
                )}
              >
                {hero.claim}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href={hero.primaryCtaUrl}
                  className={cn(
                    buttonVariants({ variant: "hero", size: "lg" }),
                    "min-h-11 gap-2 px-5 text-base font-semibold lg:min-h-12 lg:px-7 lg:text-[1.0625rem]",
                    "lg:rounded-full lg:bg-primary-foreground lg:text-primary lg:shadow-md lg:ring-0 lg:hover:bg-primary-foreground/92 lg:hover:text-primary lg:hover:shadow-lg lg:focus-visible:border-primary-foreground/50 lg:focus-visible:ring-primary-foreground/40 lg:focus-visible:ring-offset-2 lg:focus-visible:ring-offset-primary",
                  )}
                >
                  {hero.primaryCtaLabel}
                  <ArrowRight
                    className={cn(buttonTrailingArrowClassName, "size-[1.05rem]")}
                    aria-hidden
                  />
                </Link>
              </div>
              </div>
              {/* Rechter Steg: dieselbe Primary-Fläche wie die Karte (items-stretch) */}
              <div aria-hidden className="hidden w-3 shrink-0 lg:block xl:w-3.5" />
            </div>
          </div>

          {/*
            Wichtig: feste Breite (flex-none + basis), sonst kollabiert die Spalte bei absolute img/picture auf 0px
            → nur noch das grüne Panel sichtbar.
            Nur Desktop: etwas weiter nach links über den Primary-Bereich (-ml); Mobil unverändert.
          */}
          <div
            className={cn(
              "relative z-[1] w-full shrink-0 lg:z-30",
              "lg:-ml-[6rem] lg:-mt-2.5 lg:-mr-2 lg:w-[min(23rem,38vw)] lg:min-w-[19rem] lg:max-w-[23rem] lg:flex-none lg:basis-[min(23rem,38vw)]",
              "xl:-ml-[7rem] xl:-mt-3 xl:-mr-2.5 xl:w-[min(25rem,36vw)] xl:min-w-[21rem] xl:max-w-[25rem] xl:basis-[min(25rem,36vw)]",
            )}
          >
            <div
              data-hero-media
              className={cn(
                "relative min-h-[280px] h-[76vh] w-full max-h-[36rem] overflow-hidden rounded-t-3xl rounded-b-none border-0 bg-[var(--surface-muted-band)] ring-0",
                "lg:my-0 lg:h-[clamp(19.5rem,54vh,30rem)] lg:min-h-[19.5rem] lg:max-h-[30rem] lg:w-full lg:rounded-2xl lg:rounded-bl-none lg:shadow-xl lg:shadow-[#2F3B2A]/12 lg:ring-2 lg:ring-[#D8C9AF]/45",
                "xl:h-[clamp(21rem,56vh,32rem)] xl:max-h-[32rem] xl:rounded-[1.35rem] xl:rounded-bl-none xl:ring-[#D8C9AF]/55",
              )}
            >
              <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
                <ResponsiveSiteImage
                  image={hero.backgroundImage}
                  priority
                  pictureClassName="absolute inset-0 block h-full w-full"
                  imgClassName={cn(
                    "block h-full w-full border-0 object-cover p-0 outline-none ring-0",
                    "max-lg:absolute max-lg:max-h-none max-lg:max-w-none max-lg:-inset-[9.5%] max-lg:h-[119%] max-lg:w-[119%] max-lg:translate-x-[4.5%] max-lg:object-[center_33%]",
                    "lg:static lg:translate-x-0 lg:object-[center_16%]",
                  )}
                />
              </div>
              {/*
                Nur Desktop: dezenter Rahmen wie mobil im Über-mich-Bild — Border oben/seitlich, per Mask nach unten ausgeblendet.
              */}
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-x-0 top-0 z-[3] hidden h-[62%] border-2 border-b-0 border-[#2F3B2A]",
                  "[mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)]",
                  "rounded-t-2xl rounded-br-2xl rounded-bl-none lg:block",
                  "xl:rounded-t-[1.35rem] xl:rounded-br-[1.35rem]",
                )}
              />
              <HeroPhotoWaves className="hidden lg:block" />
              <div
                className="absolute inset-0 border-0 bg-[rgba(40,54,38,0.24)] ring-0 lg:hidden"
                aria-hidden
              />
              <div
                className="absolute inset-0 border-0 bg-gradient-to-t from-[rgba(34,48,34,0.38)] via-[rgba(44,60,43,0.2)] to-[rgba(58,76,56,0.07)] ring-0 lg:hidden"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-x-0 -bottom-[2px] z-[6] h-52 border-0 ring-0 md:h-64 lg:h-56 xl:h-64"
                style={{
                  background:
                    "linear-gradient(to top, var(--surface-muted-band) 0%, color-mix(in oklab, var(--surface-muted-band) 90%, transparent) 34%, color-mix(in oklab, var(--surface-muted-band) 52%, transparent) 64%, transparent 100%)",
                  maskImage: "linear-gradient(to top, black 0%, black 88%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to top, black 0%, black 88%, transparent 100%)",
                }}
                aria-hidden
              />
            </div>
          </div>

          {/*
            Eigener Flex-Nachbar rechts vom Bild — nicht Kind der Primary-Karte, sonst verdeckt z-30 das
            gesamte Karten-Substacking inkl. absolutem Schweif.
            Höhe = linke Primary-Karte (HeroAsideStrip misst data-hero-primary-card).
          */}
          <HeroAsideStrip />
        </div>
      </div>
      {waveInto ? <SectionWaveBottom from="muted-band" into={waveInto} /> : null}
    </section>
  );
}
