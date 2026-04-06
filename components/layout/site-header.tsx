import Link from "next/link";

import type { GeneralSettings } from "@/types/site-content";

import { buttonVariants } from "@/components/ui/button-variants";
import { HeaderNavLinks } from "@/components/layout/header-nav-links";
import { HashScrollLink } from "@/components/layout/hash-scroll-link";
import { MobileNav } from "@/components/layout/mobile-nav";
import { resolveNavigation } from "@/lib/resolve-navigation";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  settings: GeneralSettings;
  hasAktuellesItems?: boolean;
};

const pillShell =
  "pointer-events-auto flex w-full items-center rounded-xl border border-[rgba(68,84,64,0.22)] bg-[rgba(227,236,218,0.9)] px-4 py-2 shadow-[0_6px_24px_rgba(34,44,30,0.11)] backdrop-blur-[2px] dark:border-[rgba(177,199,170,0.2)] dark:bg-[rgba(53,64,50,0.86)] sm:px-5 sm:py-2.5";

export function SiteHeader({ settings, hasAktuellesItems }: SiteHeaderProps) {
  const navItems = resolveNavigation(
    settings,
    hasAktuellesItems === false ? { hasAktuellesItems: false } : undefined,
  );
  const headerTitle = settings.navWordmark?.trim() || settings.businessName;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 bg-transparent">
      <div className="mx-auto max-w-6xl px-4 py-1.5 sm:px-6 sm:py-2.5 lg:px-8">
        {/* Mobile: nur Marke + Burger im Pill */}
        <div className={cn(pillShell, "justify-between gap-3 lg:hidden")}>
          <HashScrollLink
            href="/#hero"
            className="min-w-0 truncate text-2xl font-semibold leading-none tracking-tight text-foreground"
          >
            {headerTitle}
          </HashScrollLink>
          <MobileNav
            items={navItems}
            businessName={headerTitle}
            appCtaLabel="Zur YogaFlow-App"
            appCtaUrl={settings.appUrl}
            menuButtonVariant="ghost"
            menuButtonClassName="-me-1 rounded-lg text-foreground hover:bg-[rgba(122,149,110,0.17)] dark:hover:bg-[rgba(166,194,152,0.16)]"
          />
        </div>

        {/* Desktop: Logo, Marke, Navigation, CTA im Pill */}
        <div className={cn(pillShell, "hidden min-h-[3rem] gap-4 lg:flex lg:items-center lg:justify-between")}>
          <HashScrollLink
            href="/#hero"
            className="flex min-w-0 shrink-0 items-center gap-2.5 text-foreground"
          >
            {settings.logo ? (
              <span className="relative size-9 shrink-0 overflow-hidden rounded-md">
                <picture className="absolute inset-0 block">
                  <source
                    media="(min-width: 1024px)"
                    srcSet={resolveImageUrl(settings.logo.desktop.url)}
                  />
                  <img
                    src={resolveImageUrl(settings.logo.mobile.url)}
                    alt=""
                    width={40}
                    height={40}
                    className="size-full object-cover"
                  />
                </picture>
              </span>
            ) : null}
            <span className="truncate text-base font-semibold tracking-tight lg:text-lg">
              {headerTitle}
            </span>
          </HashScrollLink>

          <nav
            className="flex min-w-0 flex-1 justify-center px-2"
            aria-label="Hauptnavigation"
          >
            <HeaderNavLinks items={navItems} />
          </nav>

          <Link
            href={settings.appUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Zur Yoga-Flow App (öffnet in neuem Tab)"
            className={cn(
              buttonVariants({ size: "sm" }),
              "shrink-0 rounded-lg px-4 font-semibold",
            )}
          >
            Zur Yoga-Flow App
          </Link>
        </div>
      </div>
    </header>
  );
}
