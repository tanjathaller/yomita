import Link from "next/link";
import type { ReactNode } from "react";

import type { Course } from "@/types/site-content";
import { isExternalCourse } from "@/types/site-content";

import { CourseStatusBadge } from "@/components/domain/course-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
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
      <dd className="text-[#2F3B2A] mt-0.5 text-sm leading-snug">{children}</dd>
    </div>
  );
}

export function CourseRow({ course }: { course: Course }) {
  const external = isExternalCourse(course);

  return (
    <Card className="h-full w-full min-w-0 border-border/80 shadow-sm lg:min-h-0 lg:justify-center lg:gap-3 lg:py-3">
      <CardHeader className="!flex !flex-col gap-3 space-y-0 pb-3 lg:gap-4 lg:pb-5 lg:pt-8 lg:pr-6 lg:pl-6">
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
          />
        </div>
        <dl
          className={cn(
            "space-y-2.5 border-border/50 border-t pt-3",
            "lg:grid lg:grid-cols-3 lg:items-center lg:gap-x-8 lg:gap-y-4 lg:space-y-0 lg:border-border/40 lg:border-t lg:pt-5",
          )}
        >
          {course.price ? (
            <MetaRow
              label="Preis"
              className="lg:hidden"
            >
              <span className="font-semibold tabular-nums text-base">
                {course.price}
              </span>
            </MetaRow>
          ) : null}
          <MetaRow label="Datum">{course.day}</MetaRow>
          <MetaRow label="Zeit">
            <span className="max-w-full lg:whitespace-nowrap">{course.time}</span>
          </MetaRow>
          <MetaRow label="Ort">{course.location}</MetaRow>
        </dl>
      </CardHeader>
      <CardContent className="space-y-3 border-0 pt-0 lg:px-6 lg:pb-6 lg:pt-3">
        <div className="rounded-lg border border-[#6F8B63]/20 bg-[#6F8B63]/[0.07] p-4 lg:px-3.5 lg:py-2.5">
          <p className="text-muted-foreground mb-1 text-[0.65rem] font-medium uppercase tracking-wider">
            Kursstil
          </p>
          <p className="text-[#2F3B2A] text-sm font-medium leading-snug lg:text-[0.95rem] lg:leading-snug">
            {course.description}
          </p>
        </div>
        {course.type === "internal" && course.scheduleNote ? (
          <p className="text-muted-foreground text-xs leading-relaxed">{course.scheduleNote}</p>
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
