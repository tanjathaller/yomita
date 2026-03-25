"use client";

import { useEffect } from "react";

function safeClasses(el: Element | null) {
  if (!el) return null;
  const cls = (el as HTMLElement).className;
  return typeof cls === "string" ? cls : "[non-string]";
}

function cssPick(style: CSSStyleDeclaration, keys: string[]) {
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = style.getPropertyValue(k) || (style as any)[k] || "";
  return out;
}

export function HeroSeamDebug() {
  useEffect(() => {
    const runId = `run_${Date.now()}`;
    const send = (hypothesisId: string, message: string, data: Record<string, unknown>) => {
      // #region agent log
      fetch("/api/debug-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "a1c28a",
          runId,
          hypothesisId,
          location: "components/debug/hero-seam-debug.tsx:useEffect",
          message,
          data,
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    };

    const heroShell = document.querySelector("#hero [data-hero-shell]") as HTMLElement | null;
    const heroMedia = document.querySelector("#hero [data-hero-media]") as HTMLElement | null;

    send("H0", "HeroSeamDebug start", {
      dpr: window.devicePixelRatio,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      heroShellFound: !!heroShell,
      heroMediaFound: !!heroMedia,
    });

    if (!heroShell || !heroMedia) return;

    const shellRect = heroShell.getBoundingClientRect();
    const mediaRect = heroMedia.getBoundingClientRect();

    const sampleX = Math.round(shellRect.left + shellRect.width / 2);
    const yInside = Math.round(shellRect.bottom - 1);
    const yEdge = Math.round(shellRect.bottom);
    const yBelow = Math.round(shellRect.bottom + 1);

    const samplePoints = [
      { id: "inside", x: sampleX, y: yInside },
      { id: "edge", x: sampleX, y: yEdge },
      { id: "below", x: sampleX, y: yBelow },
    ];

    const getElInfo = (el: Element | null) => {
      if (!el) return null;
      const st = getComputedStyle(el as Element);
      return {
        tag: el.tagName.toLowerCase(),
        id: (el as HTMLElement).id || null,
        classes: safeClasses(el),
        role: (el as HTMLElement).getAttribute?.("data-hero-shell")
          ? "data-hero-shell"
          : (el as HTMLElement).getAttribute?.("data-hero-media")
            ? "data-hero-media"
            : null,
        css: cssPick(st, [
          "backgroundColor",
          "borderTopWidth",
          "borderTopColor",
          "borderBottomWidth",
          "borderBottomColor",
          "boxShadow",
          "outlineWidth",
          "outlineColor",
        ]),
      };
    };

    for (const p of samplePoints) {
      const el = document.elementFromPoint(p.x, p.y);
      send("H1", "elementFromPoint sample", {
        point: p,
        shellRect: {
          left: Math.round(shellRect.left),
          top: Math.round(shellRect.top),
          right: Math.round(shellRect.right),
          bottom: Math.round(shellRect.bottom),
        },
        mediaRect: {
          left: Math.round(mediaRect.left),
          top: Math.round(mediaRect.top),
          right: Math.round(mediaRect.right),
          bottom: Math.round(mediaRect.bottom),
        },
        element: getElInfo(el),
        parent: getElInfo(el?.parentElement ?? null),
      });
    }

    const aboutTeaserCard = document.querySelector(
      "section + section .rounded-t-3xl"
    ) as HTMLElement | null;
    if (aboutTeaserCard) {
      const st = getComputedStyle(aboutTeaserCard);
      send("H2", "AboutTeaser candidate card styles", {
        classes: safeClasses(aboutTeaserCard),
        css: cssPick(st, [
          "borderTopWidth",
          "borderTopColor",
          "borderBottomWidth",
          "borderBottomColor",
          "boxShadow",
          "backgroundImage",
          "backgroundColor",
        ]),
      });
    } else {
      send("H2", "AboutTeaser candidate card not found", {});
    }
  }, []);

  return null;
}

