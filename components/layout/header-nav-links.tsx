"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { NavItem } from "@/types/site-content";
import { HashScrollLink } from "@/components/layout/hash-scroll-link";
import { cn } from "@/lib/utils";

function hashFromHref(href: string): string {
  const i = href.indexOf("#");
  return i >= 0 ? href.slice(i + 1) : "";
}

function activeIndexForHash(items: NavItem[], hash: string): number {
  if (!hash) return 0;
  const idx = items.findIndex((item) => hashFromHref(item.href) === hash);
  return idx >= 0 ? idx : 0;
}

/** Oberkante fixierter Header (~`--site-header-clearance`) in Pixeln für Scroll-Spy. */
function headerEdgePx(): number {
  if (typeof window === "undefined") return 96;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--site-header-clearance")
    .trim();
  const rem = /^([\d.]+)rem$/.exec(raw);
  if (rem) {
    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return parseFloat(rem[1]) * rootPx + 8;
  }
  return 96;
}

type HeaderNavLinksProps = {
  items: NavItem[];
  className?: string;
};

export function HeaderNavLinks({ items, className }: HeaderNavLinksProps) {
  const [hash, setHash] = useState("");
  const scrollSpySuppressedUntilRef = useRef(0);

  const sectionIdsKey = items.map((item) => item.href).join("|");
  const sectionIds = useMemo(
    () =>
      items
        .map((item) => hashFromHref(item.href))
        .filter((id): id is string => id.length > 0),
    // Primitive key: `resolveNavigation()` liefert oft neue Array-Referenzen bei gleichen Hrefs.
    [sectionIdsKey],
  );

  const syncHashFromLocation = useCallback(() => {
    setHash(
      typeof window !== "undefined"
        ? window.location.hash.replace(/^#/, "")
        : "",
    );
  }, []);

  const markHashFromClick = useCallback((id: string) => {
    scrollSpySuppressedUntilRef.current = Date.now() + 900;
    setHash(id);
  }, []);

  useEffect(() => {
    syncHashFromLocation();
    window.addEventListener("hashchange", syncHashFromLocation);
    window.addEventListener("popstate", syncHashFromLocation);
    return () => {
      window.removeEventListener("hashchange", syncHashFromLocation);
      window.removeEventListener("popstate", syncHashFromLocation);
    };
  }, [syncHashFromLocation]);

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const tick = () => {
      if (typeof window === "undefined") return;
      if (Date.now() < scrollSpySuppressedUntilRef.current) return;

      const edge = headerEdgePx();
      let best = sectionIds[0] ?? "";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= edge) {
          best = id;
        }
      }
      setHash((prev) => (prev === best ? prev : best));
    };

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    tick();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [sectionIds]);

  const activeIdx = activeIndexForHash(items, hash);

  return (
    <ul className={cn("flex flex-wrap items-center justify-center gap-1", className)}>
      {items.map((item, i) => {
        const active = i === activeIdx;
        const id = hashFromHref(item.href);
        return (
          <li key={item.href + item.label}>
            <HashScrollLink
              href={item.href}
              onAfterSamePageHashNavigate={
                id ? () => markHashFromClick(id) : undefined
              }
              className={cn(
                "inline-flex rounded-lg px-4 py-2 text-sm font-semibold tracking-tight transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-foreground/85 hover:text-foreground",
              )}
            >
              {item.label}
            </HashScrollLink>
          </li>
        );
      })}
    </ul>
  );
}
