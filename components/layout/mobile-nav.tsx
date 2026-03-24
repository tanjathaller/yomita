"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";

import type { NavItem } from "@/types/site-content";
import { wordmarkFontSizeCss } from "@/lib/wordmark-font-size";
import {
  buttonVariants,
  type ButtonVariantProps,
} from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MobileNavProps = {
  items: NavItem[];
  businessName: string;
  appCtaLabel: string;
  appCtaUrl: string;
  /** z. B. Pill-Header: `variant="ghost"` + `className` für runden Icon-Button */
  menuButtonClassName?: string;
  menuButtonVariant?: ButtonVariantProps["variant"];
};

export function MobileNav({
  items,
  businessName,
  appCtaLabel,
  appCtaUrl,
  menuButtonClassName,
  menuButtonVariant = "outline",
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const name = businessName.trim();
  const wordmarkStyle = { fontSize: wordmarkFontSizeCss(name) } as const;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant={menuButtonVariant}
            size="icon"
            className={cn("shrink-0", menuButtonClassName)}
            aria-label="Menü öffnen"
          />
        }
      >
        <MenuIcon className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="right"
        overlayClassName="bg-[rgba(42,32,24,0.28)] supports-backdrop-filter:backdrop-blur-none"
        className="w-[min(100%,75vw)] max-w-none gap-0 border-0 shadow-none bg-[rgba(239,229,216,0.96)] text-foreground supports-backdrop-filter:backdrop-blur-[20px] dark:bg-[rgba(61,50,40,0.95)] [&_button]:text-foreground [&_button]:hover:bg-[rgba(158,126,95,0.16)] dark:[&_button]:hover:bg-[rgba(225,203,178,0.14)]"
      >
        <SheetHeader className="@container border-b border-[rgba(88,66,48,0.24)] px-4 pb-6 pt-14 text-center dark:border-[rgba(226,204,180,0.2)] sm:px-6">
          <SheetTitle
            className="font-heading text-black text-center leading-[0.82] font-black tracking-[0.065em] uppercase select-none drop-shadow-[0_2px_20px_rgba(0,0,0,0.08)]"
            style={wordmarkStyle}
          >
            {name}
          </SheetTitle>
        </SheetHeader>
        <nav
          className="flex w-full flex-col px-2"
          aria-label="Hauptnavigation"
        >
          {items.map((item, index) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex min-h-[4.5rem] w-full items-center justify-center text-center text-2xl font-semibold leading-tight tracking-wide text-foreground transition-colors hover:bg-[rgba(158,126,95,0.16)] dark:hover:bg-[rgba(225,203,178,0.14)] sm:min-h-[5rem] sm:text-3xl",
                index > 0 &&
                  "border-t border-[rgba(88,66,48,0.24)] dark:border-[rgba(226,204,180,0.2)]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[rgba(88,66,48,0.24)] px-3 py-4 dark:border-[rgba(226,204,180,0.2)] sm:px-4">
          <Link
            href={appCtaUrl}
            onClick={() => setOpen(false)}
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-auto min-h-12 w-full px-4 py-3.5 text-center text-base font-semibold tracking-wide shadow-sm sm:min-h-14 sm:text-lg",
            )}
          >
            {appCtaLabel}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
