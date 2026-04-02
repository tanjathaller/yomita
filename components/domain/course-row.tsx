import Link from "next/link";

import type { Course } from "@/types/site-content";
import { isExternalCourse } from "@/types/site-content";

import { CourseStatusBadge } from "@/components/domain/course-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function CourseRow({ course }: { course: Course }) {
  const external = isExternalCourse(course);

  return (
    <Card className="h-full w-full min-w-0 border-border/80 shadow-sm lg:flex lg:flex-row lg:items-stretch lg:gap-0 lg:py-0">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 lg:min-w-0 lg:flex-1 lg:items-start lg:justify-between lg:self-stretch lg:border-border/60 lg:border-r lg:py-6 lg:pr-6 lg:pl-6">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <CardTitle className="text-[#2F3B2A] flex-1 text-xl leading-snug lg:text-[1.35rem]">
              {course.title}
            </CardTitle>
            {course.price ? (
              <span className="text-[#2F3B2A] shrink-0 text-lg font-semibold tabular-nums lg:text-[1.05rem]">
                {course.price}
              </span>
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm">
            {course.day} · {course.time} · {course.location}
          </p>
        </div>
        <CourseStatusBadge
          bookingStatus={course.bookingStatus}
          remainingSpots={course.remainingSpots}
        />
      </CardHeader>
      <CardContent className="space-y-3 lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:justify-center lg:border-0 lg:py-6 lg:pr-6 lg:pl-6">
        <p className="text-muted-foreground text-sm leading-relaxed">{course.description}</p>
        {course.type === "internal" && course.scheduleNote ? (
          <p className="text-muted-foreground text-xs">{course.scheduleNote}</p>
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
