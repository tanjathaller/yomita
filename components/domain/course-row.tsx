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
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-lg leading-snug">{course.title}</CardTitle>
          <p className="text-muted-foreground text-sm">
            {course.day} · {course.time} · {course.location}
          </p>
        </div>
        <CourseStatusBadge status={course.bookingStatus} />
      </CardHeader>
      <CardContent className="space-y-3">
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
