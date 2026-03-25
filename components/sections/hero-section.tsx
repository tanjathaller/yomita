import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { HeroSection as HeroModel } from "@/types/site-content";

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
};

export function HeroSection({ hero, businessName }: HeroSectionProps) {
  const eyebrow = businessName?.trim();
  return (
    <section
      id="hero"
      className="relative scroll-mt-[calc(var(--site-header-clearance-mobile)+0.5rem)] bg-[var(--surface-muted-band)] pb-8 sm:scroll-mt-[calc(var(--site-header-clearance)+0.5rem)] sm:pb-12 md:pb-16"
    >
      <div className="relative z-10 mx-auto max-w-6xl bg-[var(--surface-muted-band)] px-4 pt-1 pb-0 sm:px-6 sm:pt-4 lg:px-8 lg:pt-6">
        <div
          data-hero-shell
          className={cn(
            "relative w-full overflow-hidden rounded-t-3xl rounded-b-none border-0 bg-[var(--surface-muted-band)] shadow-none outline-none ring-0",
          )}
        >
          {/* Explizite Höhen (ohne min() mit Komma in Tailwind-Arbitrary) — sonst kann die Box 0px hoch werden */}
          <div
            data-hero-media
            className="relative min-h-[280px] h-[75vh] w-full max-h-[36rem] overflow-hidden rounded-t-3xl rounded-b-none border-0 bg-[var(--surface-muted-band)] ring-0 sm:max-h-[40rem] md:h-[48vh] md:max-h-[32rem] lg:max-h-[36rem]"
          >
            <picture>
              <source
                media="(min-width: 585px)"
                srcSet="/images/tanja-10-mobile.webp"
                type="image/webp"
              />
              <img
                src="/images/tanja-10-mobile.webp"
                alt="Portrait – Yogastudio und Achtsamkeit"
                className="absolute -inset-[4%] block h-[108%] w-[108%] max-h-none max-w-none border-0 object-cover object-center p-0 outline-none ring-0 sm:-inset-[3%] sm:h-[106%] sm:w-[106%] lg:-inset-[2.5%] lg:h-[105%] lg:w-[105%]"
                decoding="async"
                fetchPriority="high"
              />
            </picture>
            <div
              className="absolute inset-0 border-0 bg-[rgba(40,54,38,0.24)] ring-0"
              aria-hidden
            />
            <div
              className="absolute inset-0 border-0 bg-gradient-to-t from-[rgba(34,48,34,0.38)] via-[rgba(44,60,43,0.2)] to-[rgba(58,76,56,0.07)] ring-0"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 -bottom-[2px] z-[6] h-52 border-0 ring-0 sm:h-60 md:h-72"
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
            <div className="pointer-events-auto max-w-2xl space-y-4 p-6 sm:space-y-5 sm:p-8 lg:p-10">
              {eyebrow ? (
                <p className="font-heading text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/75 drop-shadow-[0_1px_12px_rgba(0,0,0,0.45)] sm:text-xs">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="font-heading text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white drop-shadow-[0_2px_28px_rgba(0,0,0,0.45)] sm:text-5xl lg:text-6xl">
                {hero.title}
              </h1>
              <p className="max-w-xl text-pretty text-lg leading-relaxed text-white/95 drop-shadow-[0_1px_16px_rgba(0,0,0,0.4)] sm:text-xl sm:leading-relaxed">
                {hero.claim}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href={hero.primaryCtaUrl}
                  className={cn(
                    buttonVariants({ variant: "hero", size: "lg" }),
                    "min-h-11 gap-2 px-5 text-base font-semibold sm:min-h-12 sm:px-6 sm:text-[1.05rem]",
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
      <SectionWaveBottom into="muted-band" />
    </section>
  );
}
