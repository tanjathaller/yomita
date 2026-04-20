import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import type { InternalCourse, YogaflowCourseSeries } from "@/types/site-content";

import { CourseStatusBadge } from "@/components/domain/course-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { buttonVariants } from "@/components/ui/button-variants";
import { resolveBookingBadgeLink } from "@/lib/booking-badge-link";
import { resolveYogaflowAppCoursesPageUrl } from "@/lib/yogaflow-app-courses-url";
import { cn } from "@/lib/utils";

function MetaRow({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 max-lg:flex max-lg:min-h-0 max-lg:flex-col max-lg:gap-0.5",
        className,
      )}
    >
      <dt className="text-muted-foreground text-[0.65rem] font-medium uppercase tracking-wider">
        {label}
      </dt>
      <dd className="text-[#2F3B2A] mt-0.5 min-w-0 text-sm leading-snug break-words max-lg:mt-0 max-lg:text-[0.9375rem] max-lg:leading-relaxed">
        {children}
      </dd>
    </div>
  );
}

const DEFAULT_SERIES_BADGE = "Buchung über die App";

function metaLine(value: string): string {
  const t = value.trim();
  return t.length > 0 ? t : "—";
}

function sessionShowsWaitingList(session: InternalCourse): boolean {
  const r = session.remainingSpots;
  return r !== undefined && Number.isFinite(r) && r <= 0;
}

type YogaflowSeriesCourseCardProps = {
  series: YogaflowCourseSeries;
  sessions: InternalCourse[];
  appUrl: string;
};

export function YogaflowSeriesCourseCard({
  series,
  sessions,
  appUrl,
}: YogaflowSeriesCourseCardProps) {
  const sessionBookingHref = resolveYogaflowAppCoursesPageUrl(appUrl);
  const sessionCount = sessions.length;
  const showWeekday = series.day.trim().length > 0;
  const summaryLabel =
    sessionCount === 0
      ? "Termine anzeigen"
      : sessionCount === 1
        ? "1 Termin anzeigen"
        : `${sessionCount} Termine anzeigen`;

  return (
    <Card className="w-full min-w-0 gap-2 py-2.5 border-border/80 shadow-sm transition-[box-shadow,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:min-h-0 lg:flex-1 lg:gap-2 lg:py-2">
      <CardHeader className="!flex !flex-col shrink-0 gap-2 space-y-0 px-4 pb-2.5 pt-0 lg:gap-2.5 lg:px-5 lg:pb-4 lg:pt-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <CardTitle className="text-[#2F3B2A] text-xl leading-snug lg:min-w-0 lg:flex-1 lg:text-[1.35rem]">
            {series.displayTitle}
          </CardTitle>
          {series.price ? (
            <span className="text-[#2F3B2A] hidden shrink-0 font-semibold tabular-nums text-lg lg:block lg:pt-0.5 lg:text-[1.35rem]">
              {series.price}
            </span>
          ) : null}
        </div>
        <div className="flex min-h-[26px] flex-wrap items-center gap-1.5">
          <CourseStatusBadge
            bookingStatus="available"
            staticLabel={
              series.bookingBadgeLabel?.trim() || DEFAULT_SERIES_BADGE
            }
            href={resolveBookingBadgeLink(series.bookingBadgeLink)}
          />
        </div>
        <dl
          className={cn(
            "grid min-w-0 w-full border-border/50 border-t pt-2.5",
            // Mobil & schmale Viewports: eine Spalte, gleichmäßiger Rhythmus (kein Zwei-Spalten-Zickzack)
            "grid-cols-1 gap-y-3.5",
            // Desktop (lg+): bisheriges Raster inkl. Container-Queries unverändert
            "lg:grid-cols-2 lg:gap-x-3 lg:gap-y-2.5",
            "lg:@min-[22rem]/card-header:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:@min-[22rem]/card-header:items-start lg:@min-[22rem]/card-header:gap-x-4 lg:@min-[22rem]/card-header:gap-y-0",
            "lg:@min-[30rem]/card-header:gap-x-6",
            "lg:border-border/40 lg:pt-3.5",
          )}
        >
          {series.price ? (
            <MetaRow label="Preis" className="lg:col-span-2 lg:hidden">
              <span className="font-semibold tabular-nums text-base">
                {series.price}
              </span>
            </MetaRow>
          ) : null}
          <div
            className={cn(
              "min-w-0 max-lg:col-span-full",
              // Mobil: Wochentag + Zeit nebeneinander, sobald die Kartenbreite es zulässt
              "max-lg:grid max-lg:grid-cols-1 max-lg:items-start max-lg:gap-x-4 max-lg:gap-y-2.5",
              showWeekday &&
                "max-lg:@min-[18rem]/card-header:grid-cols-2 max-lg:@min-[18rem]/card-header:gap-y-0",
              // Desktop: Kinder direkt im <dl>-Raster wie zuvor
              "lg:contents",
            )}
          >
            {showWeekday ? (
              <MetaRow label="Wochentag" className="min-w-0">
                {series.day.trim()}
              </MetaRow>
            ) : null}
            <MetaRow label="Zeit" className="min-w-0">
              {metaLine(series.time)}
            </MetaRow>
          </div>
          <MetaRow
            label="Ort"
            className="lg:col-span-2 lg:@min-[22rem]/card-header:col-span-1"
          >
            {metaLine(series.location)}
          </MetaRow>
        </dl>
      </CardHeader>
      <CardContent className="space-y-1.5 border-0 px-4 pt-0 pb-0 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-1.5 lg:space-y-0 lg:px-5 lg:pb-3 lg:pt-1.5">
        <div className="shrink-0 rounded-lg border border-[#6F8B63]/20 bg-[#6F8B63]/[0.07] p-3 lg:px-3 lg:py-1.5">
          <p className="text-muted-foreground mb-0.5 text-[0.65rem] font-medium uppercase tracking-wider">
            Kursstil
          </p>
          <MarkdownContent
            markdown={series.description}
            className="max-w-none space-y-1 text-sm font-medium leading-snug text-[#2F3B2A] lg:text-[0.95rem] lg:leading-snug [&_p]:my-0 [&_p+p]:mt-1 [&_strong]:font-semibold [&_em]:italic"
          />
        </div>
        {series.scheduleNote?.trim() ? (
          <div className="shrink-0 text-muted-foreground text-xs leading-relaxed">
            <MarkdownContent
              markdown={series.scheduleNote}
              className="max-w-none space-y-1 [&_p]:my-0 [&_p+p]:mt-1 [&_strong]:font-semibold [&_em]:italic"
            />
          </div>
        ) : null}

        <div className="hidden min-h-0 shrink lg:block lg:flex-1" aria-hidden />
        <details className="group w-full shrink-0 rounded-lg border border-border/60 bg-background/40">
          <summary
            className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-[#2F3B2A] outline-none ring-offset-background transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden"
          >
            <span className="flex items-center justify-between gap-2">
              <span>{summaryLabel}</span>
              <ChevronDown
                aria-hidden
                className="size-[1.125rem] shrink-0 text-[#2F3B2A]/75 transition-transform group-open:rotate-180"
                strokeWidth={2.75}
              />
            </span>
          </summary>
          <div className="@container/termine min-w-0 border-border/50 border-t px-3 py-2 pb-3">
            {sessionCount === 0 ? (
              <p className="text-muted-foreground text-sm leading-relaxed">
                Aktuell keine Termine in der App.
              </p>
            ) : (
              <ul className="space-y-0 divide-y divide-border/50">
                {sessions.map((session) => {
                  const waitingList = sessionShowsWaitingList(session);
                  return (
                    <li
                      key={session.id}
                      className={cn(
                        "grid min-w-0 gap-3 py-3 first:pt-1",
                        // Nebeneinander nur ab lg-Viewport und genug Kartenbreite (Desktop),
                        // darunter immer eine Spalte — Badge/Button stapeln sich zuverlässig.
                        "grid-cols-1",
                        "lg:@min-[40rem]/termine:grid-cols-[minmax(0,1fr)_auto]",
                        "lg:@min-[40rem]/termine:items-center",
                        "lg:@min-[40rem]/termine:gap-x-4",
                      )}
                    >
                      <div
                        className={cn(
                          "grid min-w-0 gap-x-3 gap-y-1",
                          "grid-cols-2",
                          "lg:@min-[40rem]/termine:grid-cols-[minmax(0,7rem)_minmax(0,1fr)]",
                          "lg:@min-[40rem]/termine:items-center",
                        )}
                      >
                        <span className="shrink-0 text-[#2F3B2A] text-sm font-medium tabular-nums">
                          {session.day}
                        </span>
                        <span className="min-w-0 text-muted-foreground text-sm [overflow-wrap:anywhere]">
                          {session.time}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-col items-start gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-start lg:@min-[40rem]/termine:justify-end">
                        <CourseStatusBadge
                          bookingStatus={session.bookingStatus}
                          remainingSpots={session.remainingSpots}
                        />
                        <Link
                          href={sessionBookingHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ size: "default" }),
                            "border border-[#6F8B63]/30 bg-[#7A956E] font-semibold text-white shadow-sm hover:bg-[#6F8B63] hover:text-white",
                          )}
                        >
                          {waitingList
                            ? "Warteliste eintragen"
                            : "Kurs buchen"}
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
