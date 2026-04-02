"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type AdminHintContent = {
  title: string;
  paragraphs: string[];
  bullets: string[];
};

export type AdminImageHintVariant = "aktuell" | "about" | "og";

const HINT_COPY: Record<
  AdminImageHintVariant,
  AdminHintContent
> = {
  aktuell: {
    title: "Bildgröße: Aktuelles-Karten",
    paragraphs: [
      "Auf der Website wird dasselbe Bild auf Mobilgeräten und Desktop verwendet; Next.js lädt automatisch passende Auflösungen. Ein zusätzliches Mobilbild ist nicht erforderlich.",
    ],
    bullets: [
      "Seitenverhältnis: 4:3 (Breite : Höhe), Darstellung mit Zuschnitt – das wichtigste Motiv sollte mittig platziert werden.",
      "Mobil: Karte nahezu in voller Breite (ca. 350–400 px Anzeige).",
      "Desktop: Zwei Spalten (ca. 550–600 px Breite pro Karte).",
      "Empfohlene Quelldatei: mindestens 1200 × 900 px; optional bis ca. 1600 × 1200 px für sehr große Monitore.",
      "Format: WebP oder JPEG; Upload maximal 5 MB (JPG, PNG, WEBP).",
    ],
  },
  about: {
    title: "Bildgroesse: Ueber-mich-Portrait",
    paragraphs: [
      "Portrait im Hochformat; eine Datei reicht fuer Mobil und Desktop.",
    ],
    bullets: [
      "Seitenverhaeltnis 4:5, Darstellung mit Zuschnitt – Gesicht und wichtige Details moeglichst zentriert.",
      "Mobil: grosse Flaeche; Desktop: etwa halbe Seitenbreite.",
      "Empfohlen: mindestens 1000×1250 px, besser 1200×1500 px (WebP/JPEG).",
    ],
  },
  og: {
    title: "Open-Graph-Bild (Link-Vorschau)",
    paragraphs: [
      "Wird von vielen Apps und Netzwerken genutzt, wenn jemand einen Link zur Website teilt (z. B. WhatsApp, Facebook).",
    ],
    bullets: [
      "Empfohlen: 1200 × 630 px, Seitenverhältnis ca. 1,91 : 1; Minimum oft 600 × 315 px.",
      "Format: JPG oder PNG für beste Kompatibilität; WebP ist möglich. Upload maximal 5 MB (JPG, PNG, WEBP).",
      "Wichtiges Motiv mittig platzieren – Vorschauen schneiden am Rand zu.",
    ],
  },
};

const SORT_ORDER_HINT: AdminHintContent = {
  title: "Reihenfolge",
  paragraphs: ["Niedrige Zahl = weiter oben auf der öffentlichen Website."],
  bullets: [],
};

/** Maus/Desktop: Hover oeffnet; Touch/Grober Zeiger: nur Klick/Tap (kein Hover-Open). */
const HOVER_FINE_MEDIA = "(hover: hover) and (pointer: fine)";

function subscribeHoverFineMedia(onChange: () => void) {
  const mq = window.matchMedia(HOVER_FINE_MEDIA);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getHoverFineMatches() {
  return window.matchMedia(HOVER_FINE_MEDIA).matches;
}

function useOpenHintOnHover() {
  return useSyncExternalStore(subscribeHoverFineMedia, getHoverFineMatches, () => false);
}

const HINT_ARIA_SUFFIX_HOVER = "; bei Maus öffnet sich der Hinweis beim Darüberfahren";
const HINT_ARIA_SUFFIX_TOUCH = "; tippen zum Öffnen";

function AdminHintPopover({
  content,
  ariaSummary,
  className,
}: {
  content: AdminHintContent;
  /** Kurzbeschreibung für den Screenreader (ohne Hover-/Tap-Zusatz). */
  ariaSummary: string;
  className?: string;
}) {
  const openOnHover = useOpenHintOnHover();
  const ariaLabel = `${ariaSummary}${openOnHover ? HINT_ARIA_SUFFIX_HOVER : HINT_ARIA_SUFFIX_TOUCH}`;

  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        openOnHover={openOnHover}
        delay={openOnHover ? 120 : undefined}
        closeDelay={openOnHover ? 220 : undefined}
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground",
          "transition-colors hover:bg-muted hover:text-foreground",
          "focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          className,
        )}
        aria-label={ariaLabel}
      >
        <Info className="size-3.5" aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={6} className="z-[200]">
          <Popover.Popup
            className={cn(
              "w-[min(calc(100vw-2rem),22rem)] rounded-lg border border-border bg-popover p-4 text-sm text-popover-foreground shadow-lg",
              "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            )}
          >
            <Popover.Title className="text-foreground mb-2 text-sm font-semibold leading-snug">
              {content.title}
            </Popover.Title>
            <div className="text-muted-foreground space-y-3 text-xs leading-relaxed">
              {content.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {content.bullets.length > 0 ? (
                <ul className="list-disc space-y-1.5 pl-4">
                  {content.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

type AdminImageSizeHintProps = {
  variant: AdminImageHintVariant;
  className?: string;
};

export function AdminImageSizeHint({ variant, className }: AdminImageSizeHintProps) {
  const copy = HINT_COPY[variant];
  const ariaSummary = `${copy.title}: empfohlene Pixelmaße und Seitenverhältnis`;

  return <AdminHintPopover content={copy} ariaSummary={ariaSummary} className={className} />;
}

/** Info-Icon + Popover (gleicher Aufbau wie Bild-Hinweis). */
export function AdminSortOrderHint({ className }: { className?: string }) {
  const ariaSummary = `${SORT_ORDER_HINT.title}: niedrige Zahl erscheint weiter oben auf der öffentlichen Website`;

  return <AdminHintPopover content={SORT_ORDER_HINT} ariaSummary={ariaSummary} className={className} />;
}

/**
 * Label-Zeile mit Info-Popover fuer Bild-URL und Upload.
 */
export function AdminImageFieldLabel({
  children,
  variant,
  htmlFor,
}: {
  children: ReactNode;
  variant: AdminImageHintVariant;
  /** Optional: z. B. fuer zugehoeriges URL-Input. */
  htmlFor?: string;
}) {
  return (
    <div className="flex min-h-7 items-center gap-1.5">
      <Label htmlFor={htmlFor} className="mb-0 font-bold">
        {children}
      </Label>
      <AdminImageSizeHint variant={variant} />
    </div>
  );
}

/**
 * Gleiche Zeilenhöhe und Abstände wie {@link AdminImageFieldLabel}, aber ohne Info-Icon
 * (Platzhalter mit gleicher Breite) – für z. B. Alt-Text neben „Bild URL“.
 */
export function AdminPairedImageFieldLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex min-h-7 items-center gap-1.5">
      <Label htmlFor={htmlFor} className="mb-0 font-bold">
        {children}
      </Label>
      <span className="inline-flex size-7 shrink-0" aria-hidden />
    </div>
  );
}

/**
 * Label „Reihenfolge“ + Info-Popover (gleiche Struktur wie „Bild hochladen“).
 */
export function AdminSortOrderLabelRow({ htmlFor }: { htmlFor?: string }) {
  return (
    <div className="flex min-h-7 items-center gap-1.5">
      <Label htmlFor={htmlFor} className="mb-0 font-bold">
        Reihenfolge
      </Label>
      <AdminSortOrderHint />
    </div>
  );
}
