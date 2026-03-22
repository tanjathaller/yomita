import Image from "next/image";
import Link from "next/link";

import type { GeneralSettings, HeroSection } from "@/types/site-content";

import { buttonVariants } from "@/components/ui/button-variants";
import { HeaderNavLinks } from "@/components/layout/header-nav-links";
import { MobileNav } from "@/components/layout/mobile-nav";
import { resolveNavigation } from "@/lib/resolve-navigation";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  settings: GeneralSettings;
  hero: HeroSection;
  hasAktuellesItems?: boolean;
};

const pillShell =
  "pointer-events-auto flex w-full items-center rounded-xl border border-border/35 bg-[var(--surface-muted-band)] px-4 py-2 shadow-[0_2px_20px_rgba(0,0,0,0.06)] sm:px-5 sm:py-2.5";

export function SiteHeader({ settings, hero, hasAktuellesItems }: SiteHeaderProps) {
  const navItems = resolveNavigation(
    settings,
    hasAktuellesItems === false ? { hasAktuellesItems: false } : undefined,
  );
  const headerTitle = settings.navWordmark?.trim() || settings.businessName;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 bg-transparent">
      <div className="mx-auto max-w-6xl px-4 py-1.5 sm:px-6 sm:py-2.5 lg:px-8">
        {/* Mobile: nur Marke + Burger im Pill */}
        <div className={cn(pillShell, "justify-between gap-3 md:hidden")}>
          <Link
            href="/#hero"
            className="min-w-0 truncate text-2xl font-semibold leading-none tracking-tight text-foreground"
          >
            {headerTitle}
          </Link>
          <MobileNav
            items={navItems}
            businessName={headerTitle}
            appCtaLabel={hero.primaryCtaLabel}
            appCtaUrl={hero.primaryCtaUrl}
            menuButtonVariant="ghost"
            menuButtonClassName="-me-1 rounded-lg text-foreground hover:bg-foreground/6"
          />
        </div>

        {/* Desktop: Logo, Marke, Navigation, CTA im Pill */}
        <div className={cn(pillShell, "hidden min-h-[3rem] gap-4 md:flex md:items-center md:justify-between")}>
          <Link
            href="/#hero"
            className="flex min-w-0 shrink-0 items-center gap-2.5 text-foreground"
          >
            {settings.logoUrl ? (
              <Image
                src={settings.logoUrl}
                alt=""
                width={40}
                height={40}
                className="size-9 shrink-0 rounded-md object-cover"
                unoptimized
              />
            ) : null}
            <span className="truncate text-base font-semibold tracking-tight sm:text-lg">
              {headerTitle}
            </span>
          </Link>

          <nav
            className="flex min-w-0 flex-1 justify-center px-2"
            aria-label="Hauptnavigation"
          >
            <HeaderNavLinks items={navItems} />
          </nav>

          <Link
            href={hero.primaryCtaUrl}
            className={cn(
              buttonVariants({ size: "sm" }),
              "shrink-0 rounded-lg px-4 font-semibold",
            )}
          >
            {hero.primaryCtaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
