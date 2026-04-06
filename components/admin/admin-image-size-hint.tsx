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

/** Pro Bild-Slot (Mobil &lt; lg vs. Desktop ≥ lg) eigene Hinweise inkl. Pixel-Richtwerte. */
export type AdminImageHintVariant =
  | "aktuellMobile"
  | "aktuellDesktop"
  | "aboutMobile"
  | "aboutDesktop"
  | "heroMobile"
  | "heroDesktop"
  | "ogMobile"
  | "ogDesktop"
  | "logoMobile"
  | "logoDesktop";

const HINT_COPY: Record<AdminImageHintVariant, AdminHintContent> = {
  aktuellMobile: {
    title: "Aktuelles · Mobil-Bild",
    paragraphs: [
      "Die Bildfläche ist auf der Website fest **4 : 3** (Breite zu Höhe). Es wird „cover“ verwendet: Nur wenn deine Datei **genau dieses Seitenverhältnis** hat, bleibt das **gesamte Bild sichtbar** und es wird nichts an den Seiten oder oben/unten abgeschnitten.",
    ],
    bullets: [
      "**Optimal:** Quelldatei **exakt 4 : 3**, z. B. **1200 × 900 px**, **1600 × 1200 px** oder **800 × 600 px** (alle dasselbe Verhältnis).",
      "Abweichende Formate (z. B. quadratisch oder Panorama) füllen zwar die Fläche, aber Randbereiche werden beschnitten.",
      "Format: WebP oder JPEG; Upload maximal 5 MB (JPG, PNG, WEBP).",
    ],
  },
  aktuellDesktop: {
    title: "Aktuelles · Desktop-Bild",
    paragraphs: [
      "Ab Desktop hat der Bildblock eine **feste Höhe** und **variable Breite** (Karte = halbe Zeile). Das sichtbare Verhältnis liegt typischerweise bei etwa **1,9 : 1 bis 2,1 : 1** (deutlich breiter als hoch). Mit „cover“ gibt es **keinen Zuschnitt** nur dann, wenn dein Bild **dieselbe Breite-zu-Höhe-Relation** wie der Rahmen hat.",
    ],
    bullets: [
      "**Praktisch optimal:** Seitenverhältnis **2 : 1** (Breite ist doppelt so groß wie die Höhe), z. B. **1920 × 960 px**, **1600 × 800 px** oder **1400 × 700 px** – damit liegst du auf den meisten Bildschirmen sehr nah am Rahmen und vermeidest große Schnitte.",
      "Sehr schmale oder sehr hohe Bilder werden stärker beschnitten.",
      "Format: WebP oder JPEG; Upload maximal 5 MB (JPG, PNG, WEBP).",
    ],
  },
  aboutMobile: {
    title: "Über mich · Mobil-Portrait",
    paragraphs: [
      "Der sichtbare Rahmen ist **4 : 5** (Hochformat, Breite : Höhe). Gleiches Seitenverhältnis in der Datei = **kein Zuschnitt** durch „cover“.",
      "Zusätzlich zoomt die Seite das Bild leicht ein (~4,5 %). Dadurch können **minimale Randbereiche** fehlen – auch bei passendem Format.",
    ],
    bullets: [
      "**Optimal:** Quelldatei **exakt 4 : 5**, z. B. **1200 × 1500 px**, **1600 × 2000 px** oder **800 × 1000 px**.",
      "Wichtiges Motiv (z. B. Gesicht) **etwas mit Abstand zur Kante** platzieren wegen des leichten Zooms.",
      "Format: WebP oder JPEG; Upload maximal 5 MB (JPG, PNG, WEBP).",
    ],
  },
  aboutDesktop: {
    title: "Über mich · Desktop-Portrait",
    paragraphs: [
      "Auch auf Desktop bleibt der Bildrahmen **4 : 5**. **Exakt 4 : 5** in der Datei vermeidet Zuschnitt durch „cover“. Der leichte Zoom (~4,5 %) gilt hier ebenfalls.",
    ],
    bullets: [
      "**Optimal:** **exakt 4 : 5**, z. B. **1600 × 2000 px** oder **1200 × 1500 px** (höhere Auflösung = schärfer auf großen Monitoren).",
      "Randbereich leicht „luftiger“ halten wegen Zoom.",
      "Format: WebP oder JPEG; Upload maximal 5 MB (JPG, PNG, WEBP).",
    ],
  },
  heroMobile: {
    title: "Hero · Mobil-Hintergrund",
    paragraphs: [
      "Wichtig: Der Hero **vergrößert** das Bild und nutzt **object-cover** mit Versatz – das Layout ist **nicht** darauf ausgelegt, die komplette Datei randlos wie in einer Galerie zu zeigen. **Vollständig sichtbar ohne jeden Schnitt** ist hier **nicht erreichbar**.",
      "Du kannst aber **stark vermeiden**, dass wichtige Teile fehlen: eher **breites** Motiv wählen und **Mitte / leicht oberhalb der Mitte** komponieren (Text liegt unten).",
    ],
    bullets: [
      "Annäherung: Quelle **16 : 9** oder etwas breiter, z. B. **1920 × 1080 px** oder **2400 × 1350 px**; auf dem Phone wirkt die Fläche hoch, trotzdem schneidet das Layout eher oben/unten zu.",
      "Sehr hohe Portrait-Fotos verlieren oft große Streifen links/rechts.",
      "Format: WebP oder JPEG; Upload maximal 5 MB (JPG, PNG, WEBP).",
    ],
  },
  heroDesktop: {
    title: "Hero · Desktop-Hintergrund",
    paragraphs: [
      "Wie auf Mobil: **Zoom + cover** – **nie** die gesamte Datei pixelgenau sichtbar. Ziel ist, das Motiv **lesbar neben Text/CTA** zu halten.",
    ],
    bullets: [
      "Annäherung: **16 : 9**, z. B. **1920 × 1080 px** oder **2560 × 1440 px**; sehr breites **21 : 9** kann ebenfalls passen, wenn das Wichtige in der Mitte sitzt.",
      "Kontrast und Ruhe im **unteren linken** Bereich (Text) einplanen.",
      "Format: WebP oder JPEG; Upload maximal 5 MB (JPG, PNG, WEBP).",
    ],
  },
  ogMobile: {
    title: "Open Graph · Mobil-Bild",
    paragraphs: [
      "Vorschauen in Apps unterscheiden sich. Wenn du **dieselbe Datei** wie für Desktop nutzt (**1200 × 630 px**, festes Verhältnis), passt das Motiv oft **ohne zusätzlichen Zuschnitt** in die übliche OG-Kachel – einzelne Apps können trotzdem anders zuschneiden.",
    ],
    bullets: [
      "**Optimal (einheitlich mit Desktop):** **exakt 1200 × 630 px** (1,91 : 1).",
      "Wichtiges Motiv **mittig**, nicht am Rand.",
      "Format: JPG oder PNG; WebP möglich. Max. 5 MB.",
    ],
  },
  ogDesktop: {
    title: "Open Graph · Desktop-Bild",
    paragraphs: [
      "Standard für Link-Vorschauen ist ein festes **rechteckiges** Format. **1200 × 630 px** ist der gängige Maßstab – Bild füllt die Vorschau ohne Verzerren; einzelne Netzwerke können dennoch minimal beschneiden.",
    ],
    bullets: [
      "**Optimal:** **exakt 1200 × 630 px** (Breite × Höhe). Alternativ **2400 × 1260 px** (gleiches Verhältnis, schärfer).",
      "Motiv mittig, wichtige Inhalte nicht in den äußeren 10 %.",
      "Format: JPG oder PNG; WebP möglich. Max. 5 MB.",
    ],
  },
  logoMobile: {
    title: "Logo · Mobil-Datei",
    paragraphs: [
      "Die Anzeige ist **quadratisch** (object-cover im Quadrat). **Exakt quadratische** Datei = **kein Zuschnitt** (das ganze Logo bleibt sichtbar). Im aktuellen Header wird das Logo nur am Desktop gezeigt; die Mobil-Datei dient der Vollständigkeit.",
    ],
    bullets: [
      "**Optimal:** **1 : 1**, z. B. **512 × 512 px** oder **384 × 384 px** (für Retina).",
      "PNG mit Transparenz oder WebP; max. 5 MB.",
    ],
  },
  logoDesktop: {
    title: "Logo · Desktop-Datei",
    paragraphs: [
      "Quadratischer Rahmen (~36 × 36 CSS-Px). **Quadratische** Quelle = **vollständig sichtbar**, ohne dass Ränder abgeschnitten werden.",
    ],
    bullets: [
      "**Optimal:** **1 : 1**, z. B. **512 × 512 px** oder mindestens **256 × 256 px**.",
      "PNG mit Transparenz oder WebP; max. 5 MB.",
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
  const ariaSummary = `${copy.title}: empfohlene Pixelmaße und Darstellung`;

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
 * Gleiche Zeilenhöhe wie {@link AdminImageFieldLabel}, aber ohne Info-Icon
 * (Platzhalter mit gleicher Breite) – z. B. für Felder ohne Bild-Hinweis.
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
