"use client";

import { useId, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

/** Matches the following section’s surface so the curve reads as one continuous band. */
export type SectionWaveTarget = "background" | "muted-band" | "muted-footer";

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
  className,
}: {
  into: SectionWaveTarget;
  /** Surface direkt über der Welle (meist Sektions-Hintergrund). Fehlt → nur `into`, wie zuvor. */
  from?: SectionWaveTarget;
  className?: string;
}) {
  const intoCss = waveFill(into);
  const fromTarget = from ?? into;
  const fromCss = waveFill(fromTarget);
  const soften = fromCss !== intoCss;
  const gradId = `wave-soft-${useId().replace(/:/g, "")}`;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -inset-x-px -bottom-px z-[1] h-[calc(3.75rem+2px)] overflow-hidden sm:h-[calc(4.5rem+2px)] md:h-[calc(6.25rem+2px)]",
        className
      )}
      style={
        {
          "--wave-soft-from": fromCss,
          "--wave-soft-into": intoCss,
        } as CSSProperties
      }
    >
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
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="34"
              x2="0"
              y2="108"
            >
              <stop
                offset="0%"
                stopColor="var(--wave-soft-from)"
                stopOpacity="0.4"
              />
              <stop
                offset="40%"
                stopColor="var(--wave-soft-from)"
                stopOpacity="0.14"
              />
              <stop
                offset="100%"
                stopColor="var(--wave-soft-from)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
        ) : null}
        <path d={wavePath} fill={intoCss} />
        {soften ? <path d={wavePath} fill={`url(#${gradId})`} /> : null}
      </svg>
      <div
        className="absolute -inset-x-[2px] bottom-0 z-[2] h-[3px]"
        style={{ backgroundColor: intoCss }}
      />
    </div>
  );
}
