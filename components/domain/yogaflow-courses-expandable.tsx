"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { Course } from "@/types/site-content";

import { CourseRow } from "@/components/domain/course-row";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/** Entspricht Tailwind `lg` – ab hier drei Spalten, mehr Kurse sichtbar. */
const LG_MIN_WIDTH = "(min-width: 1024px)";
const INITIAL_VISIBLE_MOBILE = 4;
const INITIAL_VISIBLE_LG = 6;

const courseGridItemClass = cn(
  "flex min-w-0 w-full flex-col lg:self-start",
  "lg:flex-[0_0_calc((100%_-_3rem)/3)]",
  "xl:flex-[0_0_calc((100%_-_4rem)/3)]",
);

const courseGridClass = cn(
  "flex flex-col gap-4",
  "lg:flex-row lg:flex-wrap lg:items-start lg:justify-center lg:gap-6 xl:gap-8",
);

type YogaflowCoursesExpandableProps = {
  courses: Course[];
  /** Nach „Weniger anzeigen“ sanft zu diesem Anker scrollen (z. B. Sektion `#kurse`). */
  collapseScrollToId?: string;
};

export function YogaflowCoursesExpandable({
  courses,
  collapseScrollToId,
}: YogaflowCoursesExpandableProps) {
  const [expanded, setExpanded] = useState(false);
  const [initialVisible, setInitialVisible] = useState(INITIAL_VISIBLE_MOBILE);
  const wasExpandedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia(LG_MIN_WIDTH);
    const apply = () =>
      setInitialVisible(mq.matches ? INITIAL_VISIBLE_LG : INITIAL_VISIBLE_MOBILE);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (
      collapseScrollToId &&
      wasExpandedRef.current &&
      !expanded
    ) {
      document
        .getElementById(collapseScrollToId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    wasExpandedRef.current = expanded;
  }, [collapseScrollToId, expanded]);

  const panelId = useId();
  const hasMore = courses.length > initialVisible;
  const visible = expanded ? courses : courses.slice(0, initialVisible);
  const hiddenCount = courses.length - initialVisible;

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
