import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LayoutDashboard } from "lucide-react";

import { ADMIN_MOBILE_SAVE_PORTAL_ID } from "@/lib/admin-dashboard-ui";

import { logoutOwnerAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin Dashboard Tanja Thaller",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div data-admin-shell className="bg-muted/25 flex min-h-screen flex-col">
      <header
        data-admin-header
        className="bg-background/92 sticky top-0 z-40 border-b border-primary/20 px-4 py-2.5 shadow-[0_1px_0_oklch(0.45_0.058_146/0.07)] backdrop-blur sm:px-6 sm:py-3"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 lg:mx-0 lg:max-w-none">
          <div className="min-w-0 rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/[0.14] text-primary">
                <LayoutDashboard className="size-3.5" aria-hidden />
              </span>
              <p className="truncate text-foreground text-[0.98rem] font-semibold tracking-tight sm:text-base lg:text-lg">
                Admin Dashboard Tanja Thaller
              </p>
            </div>
            <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-[0.72rem] font-medium">
              <span className="inline-block size-1.5 rounded-full bg-primary/70" aria-hidden />
              <span>Content-Verwaltung</span>
              <span aria-hidden>•</span>
              <span className="truncate">Adminbereich</span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center">
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                prefetch={false}
                aria-label="Öffnet die öffentliche Website in einem neuen Tab"
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/[0.04] px-2.5 text-sm font-medium text-primary whitespace-nowrap transition-[color,background-color,border-color] duration-200 ease-out hover:bg-primary/[0.1] hover:text-primary sm:h-8 sm:flex-none"
              >
                Website öffnen
                <ExternalLink className="size-3.5 opacity-80" aria-hidden />
              </Link>

              <form action={logoutOwnerAction} className="flex-1 sm:flex-none">
                <button
                  type="submit"
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-primary/25 bg-background px-2.5 text-sm font-medium text-foreground whitespace-nowrap transition-[color,background-color,border-color] duration-200 ease-out hover:border-primary/35 hover:bg-muted hover:text-foreground sm:h-8 sm:w-auto"
                >
                  Abmelden
                </button>
              </form>
            </div>
            <div
              id={ADMIN_MOBILE_SAVE_PORTAL_ID}
              className="w-full md:hidden empty:hidden"
              aria-live="polite"
            />
          </div>
        </div>
      </header>
      <div className="flex-1 px-4 pt-0 pb-8 sm:px-6">{children}</div>
    </div>
  );
}
