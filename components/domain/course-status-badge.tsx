import type { BookingStatus } from "@/types/site-content";

import { cn } from "@/lib/utils";

type CourseStatusBadgeProps = {
  bookingStatus: BookingStatus;
  remainingSpots?: number;
};

function labelForRemaining(remaining: number): string {
  if (remaining <= 0) return "Leider schon ausgebucht";
  if (remaining === 1) return "noch 1 Restplatz";
  if (remaining === 2) return "noch 2 Restplätze";
  return "Verfügbar";
}

export function CourseStatusBadge({
  bookingStatus,
  remainingSpots,
}: CourseStatusBadgeProps) {
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
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "ok" && "bg-primary/15 text-primary",
        tone === "few" && "bg-amber-500/15 text-amber-900 dark:text-amber-100",
        tone === "full" && "bg-muted text-muted-foreground",
      )}
    >
      {label ?? fallbackLabel}
    </span>
  );
}
