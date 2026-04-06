import Link from "next/link";
import type { ReactNode } from "react";

import type { Course } from "@/types/site-content";
import { isExternalCourse } from "@/types/site-content";

import { CourseStatusBadge } from "@/components/domain/course-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { resolveBookingBadgeLink } from "@/lib/booking-badge-link";
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

export function CourseRow({ course }: { course: Course }) {
  const external = isExternalCourse(course);

  return (
    <Card className="w-full min-w-0 gap-2.5 py-3 border-border/80 shadow-sm transition-[box-shadow,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:gap-2.5 lg:py-2.5">
      <CardHeader className="!flex !flex-col gap-2.5 space-y-0 px-4 pb-2.5 pt-0 lg:gap-3 lg:px-5 lg:pb-4 lg:pt-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <CardTitle className="text-[#2F3B2A] text-xl leading-snug lg:min-w-0 lg:flex-1 lg:text-[1.35rem]">
            {course.title}
          </CardTitle>
          {course.price ? (
            <span className="text-[#2F3B2A] hidden shrink-0 font-semibold tabular-nums text-lg lg:block lg:pt-0.5 lg:text-[1.35rem]">
              {course.price}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CourseStatusBadge
            bookingStatus={course.bookingStatus}
            remainingSpots={course.remainingSpots}
            staticLabel={course.bookingBadgeLabel}
            href={resolveBookingBadgeLink(course.bookingBadgeLink)}
          />
        </div>
        <dl
          className={cn(
            "grid min-w-0 w-full grid-cols-2 gap-x-3 gap-y-2.5 border-border/50 border-t pt-2.5",
            "@min-[22rem]/card-header:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] @min-[22rem]/card-header:items-start @min-[22rem]/card-header:gap-x-4 @min-[22rem]/card-header:gap-y-0",
            "@min-[30rem]/card-header:gap-x-6",
            "lg:border-border/40 lg:pt-3.5",
          )}
        >
          {course.price ? (
            <MetaRow
              label="Preis"
              className="col-span-2 lg:hidden"
            >
              <span className="font-semibold tabular-nums text-base">
                {course.price}
              </span>
            </MetaRow>
          ) : null}
          <MetaRow label="Wochentag">{course.day}</MetaRow>
          <MetaRow label="Zeit">{course.time}</MetaRow>
          <MetaRow
            label="Ort"
            className="col-span-2 @min-[22rem]/card-header:col-span-1"
          >
            {course.location}
          </MetaRow>
        </dl>
      </CardHeader>
      <CardContent className="space-y-2.5 border-0 px-4 pt-0 pb-0 lg:space-y-2.5 lg:px-5 lg:pb-4 lg:pt-2">
        <div className="rounded-lg border border-[#6F8B63]/20 bg-[#6F8B63]/[0.07] p-4 lg:px-3 lg:py-2">
          <p className="text-muted-foreground mb-1 text-[0.65rem] font-medium uppercase tracking-wider">
            Kursstil
          </p>
          <MarkdownContent
            markdown={course.description}
            className="max-w-none space-y-1 text-sm font-medium leading-snug text-[#2F3B2A] lg:text-[0.95rem] lg:leading-snug [&_p]:my-0 [&_p+p]:mt-1 [&_strong]:font-semibold [&_em]:italic"
          />
        </div>
        {course.type === "internal" && course.scheduleNote?.trim() ? (
          <div className="text-muted-foreground text-xs leading-relaxed">
            <MarkdownContent
              markdown={course.scheduleNote}
              className="max-w-none space-y-1 [&_p]:my-0 [&_p+p]:mt-1 [&_strong]:font-semibold [&_em]:italic"
            />
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {external ? (
            <Link
              href={course.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Zur Anbieter-Seite
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
