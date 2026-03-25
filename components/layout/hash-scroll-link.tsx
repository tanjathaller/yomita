"use client";

import Link from "next/link";
import { useCallback } from "react";

type HashScrollLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function parseHref(href: string): { path: string; hash: string } {
  const i = href.indexOf("#");
  if (i < 0) return { path: href, hash: "" };
  return { path: href.slice(0, i) || "/", hash: href.slice(i + 1) };
}

export function HashScrollLink({ href, className, children }: HashScrollLinkProps) {
  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const { path, hash } = parseHref(href);
      if (!hash) return;

      // Nur abfangen, wenn wir bereits auf derselben Seite sind.
      if (typeof window === "undefined") return;
      if (path && window.location.pathname !== path) return;

      const target = document.getElementById(hash);
      if (!target) return;

      e.preventDefault();

      const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
      target.scrollIntoView({ behavior, block: "start" });

      // Hash aktualisieren, damit aktive Nav-States etc. stimmen.
      const nextUrl = path ? `${path}#${hash}` : `#${hash}`;
      window.history.replaceState(null, "", nextUrl);
    },
    [href],
  );

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

