import Link from "next/link";

import type { GeneralSettings } from "@/types/site-content";
import { wordmarkFontSizeCss } from "@/lib/wordmark-font-size";

type SiteFooterProps = {
  settings: GeneralSettings;
};

export function SiteFooter({ settings }: SiteFooterProps) {
  const name = (settings.navWordmark?.trim() || settings.businessName).trim();
  const wordmarkStyle = { fontSize: wordmarkFontSizeCss(name) } as const;
  const year = new Date().getFullYear();

  return (
    <footer className="w-full min-w-0 overflow-x-clip bg-[var(--surface-muted-footer)]">
      {/* Eine Spalte: Links und Wordmark starten an derselben linken Kante (Y bündig mit Impressum). */}
      <div
        className="@container w-full min-w-0 pt-14 pb-6 pl-[max(0.25rem,env(safe-area-inset-left,0px))] pr-[max(0.25rem,env(safe-area-inset-right,0px))] sm:pt-16 sm:pb-8"
      >
        <div className="mx-auto flex w-max max-w-full min-w-0 flex-col items-start">
          <nav
            className="text-muted-foreground flex flex-col gap-2 pb-8 text-sm font-semibold lg:flex-row lg:gap-8"
            aria-label="Rechtliches"
          >
            <Link href="/impressum" className="hover:text-foreground w-fit transition-colors">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-foreground w-fit transition-colors">
              Datenschutz
            </Link>
          </nav>

          {/* YOMITA mittig; @-Zeile rechts darunter (gleiche Blockbreite wie Wordmark) */}
          <div className="mx-auto flex w-max min-w-0 max-w-full flex-col items-stretch">
            <p
              className="font-heading text-footer-wordmark text-center leading-[0.82] font-black tracking-[0.065em] uppercase select-none"
              style={wordmarkStyle}
            >
              {name}
            </p>
            <p className="text-muted-foreground mt-2 text-right text-xs tabular-nums">
              @Tanja Thaller {year}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
