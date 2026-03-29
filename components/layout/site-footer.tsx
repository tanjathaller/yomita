import Link from "next/link";

import type { GeneralSettings } from "@/types/site-content";
import { resolveNavigation } from "@/lib/resolve-navigation";
import { wordmarkFontSizeCss } from "@/lib/wordmark-font-size";
import { cn } from "@/lib/utils";

type SiteFooterProps = {
  settings: GeneralSettings;
};

export function SiteFooter({ settings }: SiteFooterProps) {
  const name = (settings.navWordmark?.trim() || settings.businessName).trim();
  const wordmarkStyle = { fontSize: wordmarkFontSizeCss(name) } as const;
  const year = new Date().getFullYear();
  const navItems = resolveNavigation(settings).filter((item) => item.href !== "/#hero");

  return (
    <footer className="w-full min-w-0 overflow-x-clip bg-[var(--surface-muted-footer)]">
      {/* Eine Spalte: Links und Wordmark starten an derselben linken Kante (Y bündig mit Impressum). */}
      <div
        className="@container w-full min-w-0 pt-14 pb-6 pl-[max(0.25rem,env(safe-area-inset-left,0px))] pr-[max(0.25rem,env(safe-area-inset-right,0px))] lg:pt-16 lg:pb-8"
      >
        <div className="mx-auto flex w-max max-w-full min-w-0 flex-col items-start lg:w-full lg:max-w-4xl">
          <nav className="flex w-full justify-center pb-6" aria-label="Footer Navigation">
            <ul className="grid w-full max-w-[24rem] grid-cols-2 gap-3 lg:flex lg:max-w-none lg:flex-wrap lg:justify-center lg:gap-4">
              {navItems.map((item, index) => {
                const isLastOddItem = navItems.length % 2 === 1 && index === navItems.length - 1;
                return (
                <li
                  key={item.href}
                  className={cn(
                    isLastOddItem
                      ? "col-span-2 flex justify-center lg:basis-full lg:justify-center"
                      : "w-full lg:w-auto",
                  )}
                >
                  <Link
                    href={item.href}
                    className="text-foreground/85 hover:text-foreground hover:border-primary/35 hover:bg-card/75 inline-flex w-full justify-center rounded-full border border-border/70 bg-card/55 px-4 py-2.5 text-base font-semibold tracking-wide uppercase transition-colors lg:w-auto"
                  >
                    {item.label}
                  </Link>
                </li>
              );
              })}
              <li className="col-span-2 w-full lg:col-span-1 lg:w-auto">
                <Link
                  href={settings.appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-primary-foreground hover:bg-primary/85 inline-flex w-full justify-center rounded-full px-4 py-2.5 text-base font-semibold tracking-wide uppercase transition-colors lg:w-auto"
                >
                  Zur App
                </Link>
              </li>
            </ul>
          </nav>
          <nav className="flex w-full flex-col items-center pb-8" aria-label="Rechtliches">
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-[0.12em] uppercase">
              Rechtliches
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/impressum"
                className="text-foreground/80 hover:text-foreground hover:border-primary/35 hover:bg-card/70 inline-flex rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Impressum
              </Link>
              <Link
                href="/datenschutz"
                className="text-foreground/80 hover:text-foreground hover:border-primary/35 hover:bg-card/70 inline-flex rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Datenschutz
              </Link>
            </div>
          </nav>

          {/* Mobil: @-Zeile rechts bündig zum Wordmark-Block; Desktop: beides zentriert. */}
          <div className="mx-auto flex w-max min-w-0 max-w-full flex-col items-stretch lg:w-full lg:max-w-none lg:items-center">
            <p
              className="font-heading text-footer-wordmark text-center leading-[0.82] font-black tracking-[0.065em] uppercase select-none"
              style={wordmarkStyle}
            >
              {name}
            </p>
            <p className="text-muted-foreground mt-2 text-right text-xs tabular-nums lg:text-center">
              @Tanja Thaller {year}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
