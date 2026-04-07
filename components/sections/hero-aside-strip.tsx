"use client";

import { useLayoutEffect, useState } from "react";

import { cn } from "@/lib/utils";

const HERO_PRIMARY_ID = "hero-primary-card";

/**
 * Schmaler Primary-Streifen rechts neben dem Hero-Bild.
 * Höhe = linke Hero-Karte (`#hero-primary-card`), inkl. nachgeladenen Schriften / Layout.
 */
export function HeroAsideStrip() {
  const [heightPx, setHeightPx] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const sync = () => {
      const el = document.getElementById(HERO_PRIMARY_ID);
      if (!el) return;
      setHeightPx(Math.ceil(el.getBoundingClientRect().height));
    };

    const run = () => {
      requestAnimationFrame(() => {
        sync();
        requestAnimationFrame(sync);
      });
    };

    let ro: ResizeObserver | null = null;
    let attempts = 0;

    const attach = () => {
      const el = document.getElementById(HERO_PRIMARY_ID);
      if (!el) {
        if (attempts < 40) {
          attempts += 1;
          requestAnimationFrame(attach);
        }
        return;
      }

      run();
      void document.fonts.ready.then(run);

      ro = new ResizeObserver(run);
      ro.observe(el);
      window.addEventListener("resize", run);
    };

    attach();

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", run);
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
