import Link from "next/link";
import type { ReactNode } from "react";

import type { BookingStatus } from "@/types/site-content";

import { cn } from "@/lib/utils";

type BadgeHref = {
  href: string;
  openInNewTab: boolean;
};

type CourseStatusBadgeProps = {
  bookingStatus: BookingStatus;
  remainingSpots?: number;
  /** Wenn gesetzt: fester Hinweistext statt Live-Status (manuelle Kurse). */
  staticLabel?: string;
  /** Optional: gesamte Pill als Link (URL oder interner Anker). */
  href?: BadgeHref;
};

function labelForRemaining(remaining: number): string {
  if (remaining <= 0) return "Leider schon ausgebucht";
  if (remaining === 1) return "noch 1 Restplatz";
  if (remaining === 2) return "noch 2 Restplätze";
  // Ab 3 Plätze (inkl. 99 = Sentinel aus Sync): einheitlich „Verfügbar“.
  return "Verfügbar";
}

function BadgeShell({
  href,
  className,
  children,
}: {
  href?: BadgeHref;
  className: string;
  children: ReactNode;
}) {
  const interactive =
    "cursor-pointer shadow-sm transition-[transform,box-shadow,filter] duration-200 ease-out hover:scale-[1.03] hover:shadow-md hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100";

  if (!href) {
    return <span className={className}>{children}</span>;
  }

  const merged = cn(className, interactive);

  if (href.openInNewTab) {
    return (
      <a
        href={href.href}
        target="_blank"
        rel="noopener noreferrer"
        className={merged}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href.href} className={merged}>
      {children}
    </Link>
  );
}

export function CourseStatusBadge({
  bookingStatus,
  remainingSpots,
  staticLabel,
  href,
}: CourseStatusBadgeProps) {
  if (staticLabel?.trim()) {
    return (
      <BadgeShell
        href={href}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          "bg-muted/70 text-muted-foreground",
        )}
      >
        {staticLabel.trim()}
      </BadgeShell>
    );
  }

  const hasSpots =
    remainingSpots !== undefined && Number.isFinite(remainingSpots);

  const label = hasSpots ? labelForRemaining(remainingSpots!) : null;

  const tone = (() => {
    if (hasSpots) {
      if (remainingSpots! <= 0) return "full" as const;
      if (remainingSpots! <= 2) return "few" as const;
      return "ok" as const;
    }
    return bookingStatus === "full" ? ("full" as const) : ("ok" as const);
  })();

  const fallbackLabel =
    bookingStatus === "full" ? "Ausgebucht" : "Plätze frei";

  return (
    <BadgeShell
      href={href}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "ok" && "bg-primary/15 text-primary",
        tone === "few" && "bg-amber-500/15 text-amber-900 dark:text-amber-100",
        tone === "full" && "bg-muted text-muted-foreground",
      )}
    >
      {label ?? fallbackLabel}
    </BadgeShell>
  );
}
