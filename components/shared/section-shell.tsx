import { cn } from "@/lib/utils";

import {
  SectionWaveBottom,
  type SectionWaveTarget,
} from "@/components/shared/section-wave";

type SectionShellProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
  /** z. B. abwechselnde Band-Hintergründe */
  variant?: "default" | "muted";
  /** Weicher Wellenübergang zum **nächsten** Abschnitt (Füllfarbe = dessen Hintergrund). */
  waveInto?: SectionWaveTarget;
};

export function SectionShell({
  id,
  children,
  className,
  variant = "default",
  waveInto,
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-[calc(var(--site-header-clearance-mobile)+0.5rem)] sm:scroll-mt-[calc(var(--site-header-clearance)+0.5rem)]",
        waveInto ? "relative pt-16 pb-24 sm:pt-24 sm:pb-28 md:pb-32" : "py-16 sm:py-24",
        variant === "muted"
          ? "bg-[var(--surface-muted-band)]"
          : "bg-background",
        className
      )}
    >
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
      {waveInto ? (
        <SectionWaveBottom
          into={waveInto}
          from={variant === "muted" ? "muted-band" : "background"}
        />
      ) : null}
    </section>
  );
}
