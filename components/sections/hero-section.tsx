import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { HeroSection as HeroModel } from "@/types/site-content";

import { ResponsiveSiteImage } from "@/components/shared/responsive-site-image";
import { SectionWaveBottom } from "@/components/shared/section-wave";
import {
  buttonTrailingArrowClassName,
  buttonVariants,
} from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

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
      className="relative scroll-mt-[calc(var(--site-header-clearance-mobile)+0.5rem)] bg-[var(--surface-muted-band)] pb-16 lg:scroll-mt-[calc(var(--site-header-clearance)+0.5rem)] lg:pb-[5rem] xl:pb-24"
    >
      <div className="relative z-10 mx-auto max-w-6xl bg-[var(--surface-muted-band)] px-4 pt-0 pb-0 lg:px-8 lg:pt-4 xl:max-w-7xl xl:px-10 xl:pt-6">
        <div
          data-hero-shell
          className={cn(
            "relative w-full overflow-hidden rounded-t-3xl rounded-b-none border-0 bg-[var(--surface-muted-band)] shadow-none outline-none ring-0",
          )}
        >
          {/* Explizite Höhen (ohne min() mit Komma in Tailwind-Arbitrary) — sonst kann die Box 0px hoch werden */}
          <div
            data-hero-media
            className="relative min-h-[280px] h-[76vh] w-full max-h-[36rem] overflow-hidden rounded-t-3xl rounded-b-none border-0 bg-[var(--surface-muted-band)] ring-0 lg:h-[min(52vh,38rem)] lg:max-h-[40rem] xl:h-[min(56vh,42rem)] xl:max-h-[42rem]"
          >
            <ResponsiveSiteImage
              image={hero.backgroundImage}
              priority
              imgClassName="absolute -inset-[9.5%] block h-[119%] w-[119%] max-h-none max-w-none translate-x-[4.5%] border-0 object-cover object-[center_33%] p-0 outline-none ring-0 lg:-inset-[6.5%] lg:h-[113%] lg:w-[113%] lg:translate-x-[3.5%]"
            />
            <div
              className="absolute inset-0 border-0 bg-[rgba(40,54,38,0.24)] ring-0"
              aria-hidden
            />
            <div
              className="absolute inset-0 border-0 bg-gradient-to-t from-[rgba(34,48,34,0.38)] via-[rgba(44,60,43,0.2)] to-[rgba(58,76,56,0.07)] ring-0"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 -bottom-[2px] z-[6] h-52 border-0 ring-0 lg:h-72"
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

          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end">
            <div className="pointer-events-auto max-w-2xl space-y-4 p-6 lg:space-y-5 lg:p-10 xl:max-w-3xl xl:space-y-6">
              {eyebrow ? (
                <p className="font-heading text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/75 drop-shadow-[0_1px_12px_rgba(0,0,0,0.45)] lg:text-xs">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="font-heading text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white drop-shadow-[0_2px_28px_rgba(0,0,0,0.45)] lg:text-6xl xl:text-[3.5rem] xl:leading-[1.06]">
                {hero.title}
              </h1>
              <p className="max-w-xl text-pretty text-lg leading-relaxed text-white/95 drop-shadow-[0_1px_16px_rgba(0,0,0,0.4)] lg:text-xl lg:leading-relaxed xl:max-w-2xl xl:text-[1.35rem] xl:leading-relaxed">
                {hero.claim}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href={hero.primaryCtaUrl}
                  className={cn(
                    buttonVariants({ variant: "hero", size: "lg" }),
                    "min-h-11 gap-2 px-5 text-base font-semibold lg:min-h-12 lg:px-6 lg:text-[1.05rem]",
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
          </div>
        </div>
      </div>
      {waveInto ? <SectionWaveBottom from="muted-band" into={waveInto} /> : null}
    </section>
  );
}
