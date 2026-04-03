import { cn } from "@/lib/utils";

import {
  SectionWaveBottom,
  type SectionTransitionStyle,
  type SectionWaveTarget,
} from "@/components/shared/section-wave";

type SectionShellProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
  /** Zusätzliche Klassen für den inneren Breiten-Container (`mx-auto max-w-*`). */
  containerClassName?: string;
  /** z. B. abwechselnde Band-Hintergründe */
  variant?: "default" | "muted";
  /** Weicher Wellenübergang zum **nächsten** Abschnitt (Füllfarbe = dessen Hintergrund). */
  waveInto?: SectionWaveTarget;
  /** Übergangsart: organische Welle oder reine Farbverschmelzung. */
  transitionStyle?: SectionTransitionStyle;
};

export function SectionShell({
  id,
  children,
  className,
  containerClassName,
  variant = "default",
  waveInto,
  transitionStyle = "wave",
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-[calc(var(--site-header-clearance-mobile)+0.5rem)] lg:scroll-mt-[calc(var(--site-header-clearance)+0.5rem)]",
        waveInto ? "relative pt-16 pb-24 lg:pt-24 lg:pb-32" : "py-16 lg:py-24",
        variant === "muted"
          ? "bg-[var(--surface-muted-band)]"
          : "bg-background",
        className
      )}
    >
      <div
        className={cn(
          "relative z-10 mx-auto max-w-6xl px-4 lg:px-8 xl:max-w-7xl",
          containerClassName,
        )}
      >
        {children}
      </div>
      {waveInto ? (
        <SectionWaveBottom
          into={waveInto}
          from={variant === "muted" ? "muted-band" : "background"}
          style={transitionStyle}
        />
      ) : null}
    </section>
  );
}
