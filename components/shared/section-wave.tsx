"use client";

import { useId, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

/** Matches the following section’s surface so the curve reads as one continuous band. */
export type SectionWaveTarget = "background" | "muted-band" | "muted-footer";
export type SectionTransitionStyle = "wave" | "blend";

/** Inline fill — Tailwind utility classes on `<path>` are unreliable here (default fill = black). */
function waveFill(target: SectionWaveTarget): string {
  switch (target) {
    case "background":
      return "var(--background)";
    case "muted-band":
      return "var(--surface-muted-band)";
    case "muted-footer":
      return "var(--surface-muted-footer)";
    default:
      return "var(--background)";
  }
}

const wavePath =
  "M0 72 C 200 88 340 54 480 66 C 620 78 760 58 900 70 C 1040 82 1180 56 1320 66 C 1384 72 1412 64 1440 72 L1440 120 L0 120 Z";

/**
 * Organic bottom edge — weiche Farbführung: Basis = Ziel-Surface (`into`), darauf ein
 * auslaufender Verlauf der aktuellen Sektionsfarbe (`from`), damit der Übergang weniger hart wirkt.
 */
export function SectionWaveBottom({
  into,
  from,
  style = "wave",
  className,
}: {
  into: SectionWaveTarget;
  /** Surface direkt über der Welle (meist Sektions-Hintergrund). Fehlt → nur `into`, wie zuvor. */
  from?: SectionWaveTarget;
  /** "wave" = organische Kante, "blend" = reine Farbverschmelzung ohne sichtbare Kante. */
  style?: SectionTransitionStyle;
  className?: string;
}) {
  const intoCss = waveFill(into);
  const fromTarget = from ?? into;
  const fromCss = waveFill(fromTarget);
  const soften = fromCss !== intoCss;
  const blendGradId = `wave-blend-${useId().replace(/:/g, "")}`;
  const edgeBlurId = `wave-blend-soft-${useId().replace(/:/g, "")}`;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -inset-x-px -bottom-px z-[1] h-[calc(10.5rem+2px)] overflow-hidden sm:h-[calc(13rem+2px)] md:h-[calc(16rem+2px)]",
        className
      )}
      style={
        {
          "--wave-soft-from": fromCss,
          "--wave-soft-into": intoCss,
        } as CSSProperties
      }
    >
      {style === "blend" ? (
        <div
          className="absolute inset-0"
          style={
            {
              background:
                "linear-gradient(to bottom, var(--wave-soft-from) 0%, color-mix(in oklab, var(--wave-soft-from) 88%, var(--wave-soft-into) 12%) 16%, color-mix(in oklab, var(--wave-soft-from) 74%, var(--wave-soft-into) 26%) 32%, color-mix(in oklab, var(--wave-soft-from) 58%, var(--wave-soft-into) 42%) 48%, color-mix(in oklab, var(--wave-soft-from) 42%, var(--wave-soft-into) 58%) 62%, color-mix(in oklab, var(--wave-soft-from) 28%, var(--wave-soft-into) 72%) 74%, color-mix(in oklab, var(--wave-soft-from) 16%, var(--wave-soft-into) 84%) 86%, color-mix(in oklab, var(--wave-soft-from) 7%, var(--wave-soft-into) 93%) 94%, var(--wave-soft-into) 100%)",
              filter: "blur(16px)",
              transform: "translateY(8px) scaleX(1.03)",
            } as CSSProperties
          }
        />
      ) : null}
      {style === "blend" ? null : (
      <svg
        className="relative z-[1] block h-full w-full"
        viewBox="0 0 1440 120"
        fill="none"
        preserveAspectRatio="none"
        shapeRendering="geometricPrecision"
        xmlns="http://www.w3.org/2000/svg"
      >
        {soften ? (
          <defs>
            <linearGradient
              id={blendGradId}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="20"
              x2="0"
              y2="120"
            >
              <stop offset="0%" stopColor="var(--wave-soft-from)" />
              <stop
                offset="24%"
                stopColor="color-mix(in oklab, var(--wave-soft-from) 76%, var(--wave-soft-into) 24%)"
              />
              <stop
                offset="48%"
                stopColor="color-mix(in oklab, var(--wave-soft-from) 54%, var(--wave-soft-into) 46%)"
              />
              <stop
                offset="70%"
                stopColor="color-mix(in oklab, var(--wave-soft-from) 30%, var(--wave-soft-into) 70%)"
              />
              <stop offset="100%" stopColor="var(--wave-soft-into)" />
            </linearGradient>
            <filter
              id={edgeBlurId}
              x="-8%"
              y="-58%"
              width="116%"
              height="220%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation="9" />
            </filter>
          </defs>
        ) : null}
        {soften ? (
          <path d={wavePath} fill={`url(#${blendGradId})`} filter={`url(#${edgeBlurId})`} />
        ) : (
          <path d={wavePath} fill={intoCss} />
        )}
        {soften ? (
          <path
            d={wavePath}
            fill="none"
            stroke="var(--wave-soft-from)"
            strokeWidth="34"
            strokeOpacity="0.12"
            filter={`url(#${edgeBlurId})`}
          />
        ) : null}
      </svg>
      )}
    </div>
  );
}
