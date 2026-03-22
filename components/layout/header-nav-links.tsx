"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import type { NavItem } from "@/types/site-content";
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

type HeaderNavLinksProps = {
  items: NavItem[];
  className?: string;
};

export function HeaderNavLinks({ items, className }: HeaderNavLinksProps) {
  const [hash, setHash] = useState("");

  const syncHash = useCallback(() => {
    setHash(
      typeof window !== "undefined"
        ? window.location.hash.replace(/^#/, "")
        : "",
    );
  }, []);

  useEffect(() => {
    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, [syncHash]);

  const activeIdx = activeIndexForHash(items, hash);

  return (
    <ul className={cn("flex flex-wrap items-center justify-center gap-1", className)}>
      {items.map((item, i) => {
        const active = i === activeIdx;
        return (
          <li key={item.href + item.label}>
            <Link
              href={item.href}
              onClick={() => queueMicrotask(syncHash)}
              className={cn(
                "inline-flex rounded-lg px-4 py-2 text-sm font-semibold tracking-tight transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-foreground/85 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
