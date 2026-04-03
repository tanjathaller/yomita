import Link from "next/link";

import type { Course } from "@/types/site-content";

import { CourseRow } from "@/components/domain/course-row";
import { YogaflowCoursesExpandable } from "@/components/domain/yogaflow-courses-expandable";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { SectionShell } from "@/components/shared/section-shell";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const manualGridClass = cn(
  "flex flex-col gap-4",
  "lg:flex-row lg:flex-wrap lg:items-stretch lg:justify-center lg:gap-6 xl:gap-8",
);

const manualItemClass = cn(
  "flex min-w-0 w-full flex-col lg:h-full",
  "lg:flex-[0_0_calc((100%_-_3rem)/3)]",
  "xl:flex-[0_0_calc((100%_-_4rem)/3)]",
);

type CoursesSectionProps = {
  /** Aus YogaFlow-Sync (`data/yogaflow-courses.json`). */
  yogaflowCourses: Course[];
  /** Manuell im Site-Content gepflegt (nicht in der App). */
  manualCourses: Course[];
  appUrl: string;
  /** Kleines Label über der Headline (z. B. „Angebot“). */
  eyebrowLabel?: string;
  /** Optionaler Sektionstitel (Fallback: „Kurse & Termine“). */
  sectionTitle?: string;
  /** Optionaler Sektionstext (Markdown; Fallback: Standardtext inkl. Link zum Kontakt). */
  sectionIntro?: string;
  /** Überschrift über den manuellen Kursen, wenn YogaFlow- und manuelle Liste beide sichtbar. */
  manualSectionTitle?: string;
  /** When true, this block sits below „Aktuelles“ in the same muted band (spacing + divider). */
  afterAktuelles?: boolean;
  /** Wenn es kein Aktuelles gibt: unter dem Kurz-„Über mich“-Teaser (spacing + divider). */
  afterAboutTeaser?: boolean;
};

export function CoursesSection({
  yogaflowCourses,
  manualCourses,
  appUrl,
  eyebrowLabel,
  sectionTitle,
  sectionIntro,
  manualSectionTitle,
  afterAktuelles = false,
  afterAboutTeaser = false,
}: CoursesSectionProps) {
  const eyebrow = eyebrowLabel?.trim() || "Angebot";
  const heading = sectionTitle?.trim() || "Kurse & Termine";
  const introMarkdown =
    sectionIntro?.trim() ||
    "Als Bestandskund:in buchst du deine Stunden ganz entspannt über die App. Wenn du neu bist oder Fragen hast, bin ich gern für dich da - schreib mir einfach über das [Kontaktformular](/#kontakt).";
  const manualHeading =
    manualSectionTitle?.trim() || "Weitere Angebote";
  const hasYogaflow = yogaflowCourses.length > 0;
  const hasManual = manualCourses.length > 0;
  const showManualSubheading = hasYogaflow && hasManual;

  return (
    <SectionShell
      id="kurse"
      variant="muted"
      containerClassName="max-w-7xl lg:max-w-[min(88rem,calc(100vw-2rem))] xl:max-w-[min(96rem,calc(100vw-2.5rem))]"
      className={cn(
        afterAktuelles || afterAboutTeaser
          ? "pt-12 pb-24 lg:pt-16 lg:pb-34"
          : "pt-8 pb-24 lg:pt-10 lg:pb-34",
        "bg-[linear-gradient(to_bottom,var(--surface-muted-band)_0%,var(--surface-muted-band)_66%,color-mix(in_oklab,var(--surface-muted-band)_84%,var(--background)_16%)_78%,color-mix(in_oklab,var(--surface-muted-band)_60%,var(--background)_40%)_89%,color-mix(in_oklab,var(--surface-muted-band)_30%,var(--background)_70%)_97%,var(--background)_100%)]",
      )}
    >
      <div className="max-w-2xl pl-4 lg:pl-6">
        <div className="relative inline-block pr-6 lg:pr-7">
          <p className="mb-2 ml-1 text-xs font-semibold tracking-[0.18em] text-[#7A956E] uppercase lg:text-sm">
            {eyebrow}
          </p>
          <h2 className="text-[#2F3B2A] text-5xl font-semibold tracking-tight lg:text-6xl">
            {heading}
          </h2>
          <span
            aria-hidden
            className="mt-2 ml-3 block h-1 w-40 rounded-full bg-[#D8C9AF]"
          />
        </div>
      </div>
      <div className="mt-4 max-w-2xl pl-4 lg:mt-5 lg:pl-6">
        <MarkdownContent
          markdown={introMarkdown}
          className={cn(
            "max-w-prose text-muted-foreground [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground lg:[&_p]:text-base",
            "[&_a]:text-primary [&_a]:font-medium [&_a]:underline-offset-4 hover:[&_a]:underline",
          )}
        />
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

      <div className="mt-8 w-full">
        {hasYogaflow ? (
          <YogaflowCoursesExpandable
            courses={yogaflowCourses}
            collapseScrollToId="kurse"
          />
        ) : null}

        {showManualSubheading ? (
          <div className="mt-14 max-w-2xl border-border/60 border-t pt-10 pl-4 lg:mt-16 lg:pt-12 lg:pl-6">
            <div className="relative inline-block pr-6 lg:pr-7">
              <h3 className="text-[#2F3B2A] text-5xl font-semibold tracking-tight lg:text-6xl">
                {manualHeading}
              </h3>
              <span
                aria-hidden
                className="mt-2 ml-3 block h-1 w-40 rounded-full bg-[#D8C9AF]"
              />
            </div>
            <p className="text-muted-foreground mt-4 max-w-prose pl-4 text-sm leading-relaxed lg:mt-5 lg:pl-6 lg:text-base">
              Diese Termine sind nicht über die YogaFlow-App gebucht – Infos und
              Anmeldung siehe jeweils auf der Karte oder über das Kontaktformular.
            </p>
          </div>
        ) : null}

        {hasManual ? (
          <div
            className={cn(
              manualGridClass,
              showManualSubheading ? "mt-8 lg:mt-10" : "mt-8",
            )}
          >
            {manualCourses.map((course) => (
              <div key={course.id} className={manualItemClass}>
                <CourseRow course={course} />
              </div>
            ))}
          </div>
        ) : null}

        {!hasYogaflow && !hasManual ? (
          <p className="text-muted-foreground text-center text-sm">
            Aktuell sind keine Kurse hinterlegt.
          </p>
        ) : null}
      </div>
    </SectionShell>
  );
}
