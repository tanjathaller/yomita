import type { ReactNode } from "react";

import type { InternalCourse, YogaflowCourseSeries } from "@/types/site-content";

import { CourseStatusBadge } from "@/components/domain/course-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className={cn("min-w-0", className)}>
      <dt className="text-muted-foreground text-[0.65rem] font-medium uppercase tracking-wider">
        {label}
      </dt>
      <dd className="text-[#2F3B2A] mt-0.5 min-w-0 text-sm leading-snug break-words">
        {children}
      </dd>
    </div>
  );
}

type YogaflowSeriesCourseCardProps = {
  series: YogaflowCourseSeries;
  sessions: InternalCourse[];
};

export function YogaflowSeriesCourseCard({
  series,
  sessions,
}: YogaflowSeriesCourseCardProps) {
  const sessionCount = sessions.length;
  const summaryLabel =
    sessionCount === 0
      ? "Termine anzeigen"
      : sessionCount === 1
        ? "1 Termin anzeigen"
        : `${sessionCount} Termine anzeigen`;

  return (
    <Card className="w-full min-w-0 gap-2.5 py-3 border-border/80 shadow-sm transition-[box-shadow,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:gap-2.5 lg:py-2.5">
      <CardHeader className="!flex !flex-col gap-2.5 space-y-0 px-4 pb-2.5 pt-0 lg:gap-3 lg:px-5 lg:pb-4 lg:pt-5">
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
        <div
          className="flex min-h-[28px] flex-wrap items-center gap-2"
          aria-hidden
        />
        <dl
          className={cn(
            "grid min-w-0 w-full grid-cols-2 gap-x-3 gap-y-2.5 border-border/50 border-t pt-2.5",
            "@min-[22rem]/card-header:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] @min-[22rem]/card-header:items-start @min-[22rem]/card-header:gap-x-4 @min-[22rem]/card-header:gap-y-0",
            "@min-[30rem]/card-header:gap-x-6",
            "lg:border-border/40 lg:pt-3.5",
          )}
        >
          {series.price ? (
            <MetaRow label="Preis" className="col-span-2 lg:hidden">
              <span className="font-semibold tabular-nums text-base">
                {series.price}
              </span>
            </MetaRow>
          ) : null}
          <MetaRow label="Wochentag">{series.day}</MetaRow>
          <MetaRow label="Zeit">{series.time}</MetaRow>
          <MetaRow
            label="Ort"
            className="col-span-2 @min-[22rem]/card-header:col-span-1"
          >
            {series.location}
          </MetaRow>
        </dl>
      </CardHeader>
      <CardContent className="space-y-2.5 border-0 px-4 pt-0 pb-0 lg:space-y-2.5 lg:px-5 lg:pb-4 lg:pt-2">
        <div className="rounded-lg border border-[#6F8B63]/20 bg-[#6F8B63]/[0.07] p-4 lg:px-3 lg:py-2">
          <p className="text-muted-foreground mb-1 text-[0.65rem] font-medium uppercase tracking-wider">
            Kursstil
          </p>
          <p className="text-[#2F3B2A] text-sm font-medium leading-snug lg:text-[0.95rem] lg:leading-snug">
            {series.description}
          </p>
        </div>
        {series.scheduleNote ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            {series.scheduleNote}
          </p>
        ) : null}

        <details className="group rounded-lg border border-border/60 bg-background/40">
          <summary
            className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-[#2F3B2A] outline-none ring-offset-background transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden"
          >
            <span className="flex items-center justify-between gap-2">
              <span>{summaryLabel}</span>
              <span
                aria-hidden
                className="text-muted-foreground text-xs font-normal transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </span>
          </summary>
          <div className="border-border/50 border-t px-3 py-2 pb-3">
            {sessionCount === 0 ? (
              <p className="text-muted-foreground text-sm leading-relaxed">
                Aktuell keine Termine in der App.
              </p>
            ) : (
              <ul className="space-y-0 divide-y divide-border/50">
                {sessions.map((session) => (
                  <li
                    key={session.id}
                    className="flex flex-col gap-2 py-3 first:pt-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,7rem)_minmax(0,1fr)] sm:items-center">
                      <span className="text-[#2F3B2A] text-sm font-medium tabular-nums">
                        {session.day}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {session.time}
                      </span>
                    </div>
                    <CourseStatusBadge
                      bookingStatus={session.bookingStatus}
                      remainingSpots={session.remainingSpots}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
