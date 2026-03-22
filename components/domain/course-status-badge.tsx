import type { BookingStatus } from "@/types/site-content";

import { cn } from "@/lib/utils";

const labels: Record<BookingStatus, string> = {
  available: "Plätze frei",
  full: "Ausgebucht",
};

export function CourseStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "available" && "bg-primary/15 text-primary",
        status === "full" && "bg-muted text-muted-foreground"
      )}
    >
      {labels[status]}
    </span>
  );
}
