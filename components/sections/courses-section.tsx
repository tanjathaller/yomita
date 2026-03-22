import Link from "next/link";

import type { Course } from "@/types/site-content";

import { CourseRow } from "@/components/domain/course-row";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionShell } from "@/components/shared/section-shell";
import { cn } from "@/lib/utils";

type CoursesSectionProps = {
  courses: Course[];
  /** When true, this block sits below „Aktuelles“ in the same muted band (spacing + divider). */
  afterAktuelles?: boolean;
  /** Wenn es kein Aktuelles gibt: unter dem Kurz-„Über mich“-Teaser (spacing + divider). */
  afterAboutTeaser?: boolean;
};

export function CoursesSection({
  courses,
  afterAktuelles = false,
  afterAboutTeaser = false,
}: CoursesSectionProps) {
  return (
    <SectionShell
      id="kurse"
      variant="muted"
      waveInto="background"
      className={cn(
        "-mt-px",
        afterAktuelles || afterAboutTeaser
          ? "-mt-px pt-12 sm:pt-14 md:pt-16"
          : "pt-8 sm:pt-10 md:pt-12",
      )}
    >
      <SectionHeading
        eyebrow="Angebot"
        title="Kurse & Termine"
        className="max-w-2xl"
      />
      <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
        Bestandskund:innen buchen über die App. Bei Fragen oder als Neukund:in erreichst du uns
        über das{" "}
        <Link href="/#kontakt" className="text-primary font-medium underline-offset-4 hover:underline">
          Kontaktformular
        </Link>
        .
      </p>
      <div className="mt-10 grid gap-4 sm:gap-6">
        {courses.map((course) => (
          <CourseRow key={course.id} course={course} />
        ))}
      </div>
    </SectionShell>
  );
}
