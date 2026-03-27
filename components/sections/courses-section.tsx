import Link from "next/link";

import type { Course } from "@/types/site-content";

import { CourseRow } from "@/components/domain/course-row";
import { HashScrollLink } from "@/components/layout/hash-scroll-link";
import { SectionShell } from "@/components/shared/section-shell";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type CoursesSectionProps = {
  courses: Course[];
  appUrl: string;
  /** When true, this block sits below „Aktuelles“ in the same muted band (spacing + divider). */
  afterAktuelles?: boolean;
  /** Wenn es kein Aktuelles gibt: unter dem Kurz-„Über mich“-Teaser (spacing + divider). */
  afterAboutTeaser?: boolean;
};

export function CoursesSection({
  courses,
  appUrl,
  afterAktuelles = false,
  afterAboutTeaser = false,
}: CoursesSectionProps) {
  return (
    <SectionShell
      id="kurse"
      variant="muted"
      className={cn(
        afterAktuelles || afterAboutTeaser
          ? "pt-12 pb-24 sm:pt-14 sm:pb-30 md:pt-16 md:pb-34"
          : "pt-8 pb-24 sm:pt-10 sm:pb-30 md:pt-12 md:pb-34",
        "bg-[linear-gradient(to_bottom,var(--surface-muted-band)_0%,var(--surface-muted-band)_66%,color-mix(in_oklab,var(--surface-muted-band)_84%,var(--background)_16%)_78%,color-mix(in_oklab,var(--surface-muted-band)_60%,var(--background)_40%)_89%,color-mix(in_oklab,var(--surface-muted-band)_30%,var(--background)_70%)_97%,var(--background)_100%)]",
      )}
    >
      <div className="max-w-2xl pl-4 sm:pl-6">
        <div className="relative inline-block pr-6 sm:pr-7">
          <p className="mb-2 ml-1 text-xs font-semibold tracking-[0.18em] text-[#7A956E] uppercase sm:text-sm">
            Angebot
          </p>
          <h2 className="text-[#2F3B2A] text-5xl font-semibold tracking-tight sm:text-6xl">
            Kurse & Termine
          </h2>
          <span
            aria-hidden
            className="mt-2 ml-3 block h-1 w-40 rounded-full bg-[#D8C9AF]"
          />
        </div>
      </div>
      <div className="mt-4 max-w-2xl pl-4 sm:mt-5 sm:pl-6">
        <p className="text-muted-foreground max-w-prose text-sm leading-relaxed sm:text-base">
          Als Bestandskund:in buchst du deine Stunden ganz entspannt über die App. Wenn du neu
          bist oder Fragen hast, bin ich gern für dich da - schreib mir einfach über das{" "}
          <HashScrollLink href="/#kontakt" className="text-primary font-medium underline-offset-4 hover:underline">
            Kontaktformular
          </HashScrollLink>
          .
        </p>
        <div className="mt-4">
          <Link
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: "lg" }),
              "min-h-11 min-w-36 rounded-lg border border-[#6F8B63]/30 bg-[#7A956E] px-6 text-base font-semibold text-white shadow-sm hover:bg-[#6F8B63] hover:text-white",
            )}
          >
            Zur App
          </Link>
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:gap-6">
        {courses.map((course) => (
          <CourseRow key={course.id} course={course} />
        ))}
      </div>
    </SectionShell>
  );
}
