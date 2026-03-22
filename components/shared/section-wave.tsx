import { cn } from "@/lib/utils";

/** Matches the following section’s surface so the curve reads as one continuous band. */
export type SectionWaveTarget = "background" | "muted-band" | "muted-footer";

/** Inline fill — Tailwind utility classes on `<path>` are unreliable here (default fill = black). */
function waveFill(into: SectionWaveTarget): string {
  switch (into) {
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

/** Organic bottom edge — eine Fläche, keine Doppelkurve (vermeidet sichtbare Linie). */
export function SectionWaveBottom({
  into,
  className,
}: {
  into: SectionWaveTarget;
  className?: string;
}) {
  const fill = waveFill(into);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -inset-x-px -bottom-px z-[1] h-[calc(3.5rem+2px)] overflow-hidden sm:h-[calc(4.25rem+2px)] md:h-[calc(6rem+2px)]",
        className
      )}
    >
      {/* `block` vermeidet die typische Baseline-Lücke unter inline-SVG (sonst sichtbare Haarlinie). */}
      <svg
        className="relative z-[1] block h-full w-full"
        viewBox="0 0 1440 120"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 78 C 260 42 440 92 700 52 C 900 22 1080 76 1280 46 C 1368 32 1410 58 1440 50 L1440 120 L0 120 Z"
          style={{ fill }}
        />
      </svg>
      {/* Überdeckt Anti-Aliasing-Spalt zum Folgeabschnitt (Farbe = Wellenfüllung = nächster Hintergrund). */}
      <div
        className="absolute -inset-x-[2px] bottom-0 z-[2] h-[3px]"
        style={{ backgroundColor: fill }}
      />
    </div>
  );
}
