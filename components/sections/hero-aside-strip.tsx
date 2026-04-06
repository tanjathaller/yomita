"use client";

import { useLayoutEffect, useState } from "react";

import { cn } from "@/lib/utils";

const PRIMARY_SELECTOR = "[data-hero-primary-card]";

/**
 * Schmaler Primary-Streifen rechts neben dem Hero-Bild.
 * Höhe folgt der linken Hero-Karte (Inhalt + innerer Steg), damit beide grünen Flächen bündig enden.
 */
export function HeroAsideStrip() {
  const [heightPx, setHeightPx] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const primary = document.querySelector<HTMLElement>(PRIMARY_SELECTOR);
    if (!primary) return;

    const sync = () => {
      setHeightPx(Math.round(primary.getBoundingClientRect().height));
    };

    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(primary);
    window.addEventListener("resize", sync);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={heightPx != null ? { height: heightPx } : undefined}
      className={cn(
        "pointer-events-none relative z-20 hidden shrink-0 lg:block lg:self-start",
        "lg:w-10 lg:rounded-r-xl lg:rounded-tl-none lg:bg-primary lg:shadow-[0_12px_32px_-20px_rgba(25,38,26,0.28)]",
        "xl:w-12 xl:rounded-r-[1.1rem]",
        heightPx == null && "lg:min-h-[22.5rem]",
      )}
    />
  );
}
