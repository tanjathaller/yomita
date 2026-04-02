"use client";

import { useId, useState } from "react";

import type { Course } from "@/types/site-content";

import { CourseRow } from "@/components/domain/course-row";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const INITIAL_VISIBLE = 6;

const courseGridItemClass = cn(
  "flex min-w-0 w-full flex-col",
  "lg:flex-[0_0_calc((100%_-_1.5rem)/2)]",
  "xl:flex-[0_0_calc((100%_-_2rem)/2)]",
);

const courseGridClass = cn(
  "flex flex-col gap-4",
  "lg:flex-row lg:flex-wrap lg:justify-center lg:gap-6 xl:gap-8",
);

type YogaflowCoursesExpandableProps = {
  courses: Course[];
};

export function YogaflowCoursesExpandable({
  courses,
}: YogaflowCoursesExpandableProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const hasMore = courses.length > INITIAL_VISIBLE;
  const visible = expanded ? courses : courses.slice(0, INITIAL_VISIBLE);
  const hiddenCount = courses.length - INITIAL_VISIBLE;

  return (
    <div className="w-full">
      <div className={courseGridClass} id={panelId}>
        {visible.map((course) => (
          <div key={course.id} className={courseGridItemClass}>
            <CourseRow course={course} />
          </div>
        ))}
      </div>
      {hasMore ? (
        <div className="mt-6 flex justify-center lg:mt-8">
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-h-11 rounded-lg border-[#6F8B63]/40 px-6 text-base font-semibold text-[#2F3B2A]",
            )}
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded
              ? "Weniger anzeigen"
              : `Mehr anzeigen (${hiddenCount} weitere)`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
