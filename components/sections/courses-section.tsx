import Link from "next/link";

import type { Course, GeneralSettings } from "@/types/site-content";

import { CourseRow } from "@/components/domain/course-row";
import { YogaflowSeriesCourseCard } from "@/components/domain/yogaflow-series-course-card";
import { CoursesGrid } from "@/components/sections/courses-grid";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { SectionShell } from "@/components/shared/section-shell";
import { buttonVariants } from "@/components/ui/button-variants";
import { groupYogaflowCoursesIntoSeries } from "@/lib/yogaflow-series-group";
import { cn } from "@/lib/utils";

const courseGridClass = cn(
  "flex flex-col gap-4",
  // lg+: Karten nur so hoch wie ihr Inhalt (kein Mitstrecken bei geöffnetem Termin-Accordion).
  "lg:flex-row lg:flex-wrap lg:items-start lg:justify-center lg:gap-6 xl:gap-8",
);

const courseGridItemClass = cn(
  "flex min-w-0 w-full flex-col",
  "lg:min-h-[320px] lg:flex-[0_0_calc((100%_-_1.5rem)/2)]",
  "xl:min-h-[320px] xl:flex-[0_0_calc((100%_-_2rem)/2)]",
);

type CoursesSectionProps = {
  /** Aus YogaFlow-Sync (Remote-JSON oder lokale Datei). */
  yogaflowCourses: Course[];
  /** Serien-Konfiguration inkl. Defaults aus `withSortedLists`. */
  yogaflowCourseSeries: NonNullable<GeneralSettings["yogaflowCourseSeries"]>;
  /** Manuell im Site-Content gepflegt (nicht in der App). */
  manualCourses: Course[];
  appUrl: string;
  /** Kleines Label über der Headline (z. B. „Angebot“). */
  eyebrowLabel?: string;
  /** Optionaler Sektionstitel (Fallback: „Kurse & Termine“). */
  sectionTitle?: string;
  /** Optionaler Sektionstext (Markdown; Fallback: Standardtext inkl. Link zum Kontakt). */
  sectionIntro?: string;
  /** Button unter dem Einleitungstext → `appUrl`; Fallback: „Kurs buchen“. */
  appButtonLabel?: string;
  /** When true, this block sits below „Aktuelles“ in the same muted band (spacing + divider). */
  afterAktuelles?: boolean;
  /** Wenn es kein Aktuelles gibt: unter dem Kurz-„Über mich“-Teaser (spacing + divider). */
  afterAboutTeaser?: boolean;
  /** Remote-URL gesetzt, Server-Fetch der Kurs-JSON fehlgeschlagen. */
  yogaflowCoursesLoadError?: boolean;
};

export function CoursesSection({
  yogaflowCourses,
  yogaflowCourseSeries,
  manualCourses,
  appUrl,
  eyebrowLabel,
  sectionTitle,
  sectionIntro,
  appButtonLabel,
  afterAktuelles = false,
  afterAboutTeaser = false,
  yogaflowCoursesLoadError = false,
}: CoursesSectionProps) {
  const eyebrow = eyebrowLabel?.trim();
  const heading = sectionTitle?.trim() || "Kurse & Termine";
  const appCtaLabel = appButtonLabel?.trim() || "Kurs buchen";
  const introMarkdown =
    sectionIntro?.trim() ||
    "Als Bestandskund:in buchst du deine Stunden ganz entspannt über die App. Wenn du neu bist oder Fragen hast, bin ich gern für dich da - schreib mir einfach über das [Kontaktformular](/#kontakt).";

  const seriesBlocks = groupYogaflowCoursesIntoSeries(
    yogaflowCourseSeries,
    yogaflowCourses,
  );
  const sortedCards = [
    ...seriesBlocks.map((block) => ({
      type: "series" as const,
      sortOrder: block.series.sortOrder,
      sortKey: block.series.id,
      block,
    })),
    ...manualCourses.map((course) => ({
      type: "manual" as const,
      sortOrder: course.sortOrder,
      sortKey: course.id,
      course,
    })),
  ].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.sortKey.localeCompare(b.sortKey);
  });
  const hasManual = manualCourses.length > 0;
  const hasSeries = seriesBlocks.length > 0;
  const hasAnyGrid = hasSeries || hasManual;

  return (
    <SectionShell
      variant="muted"
      containerClassName="max-w-7xl lg:max-w-[min(88rem,calc(100%-2rem))] xl:max-w-[min(96rem,calc(100%-2.5rem))]"
      className={cn(
        afterAktuelles || afterAboutTeaser
          ? "pt-12 pb-24 lg:pt-16 lg:pb-34"
          : "pt-8 pb-24 lg:pt-10 lg:pb-34",
        "bg-[linear-gradient(to_bottom,var(--surface-muted-band)_0%,var(--surface-muted-band)_66%,color-mix(in_oklab,var(--surface-muted-band)_84%,var(--background)_16%)_78%,color-mix(in_oklab,var(--surface-muted-band)_60%,var(--background)_40%)_89%,color-mix(in_oklab,var(--surface-muted-band)_30%,var(--background)_70%)_97%,var(--background)_100%)]",
      )}
    >
      <div className="max-w-2xl pl-4 lg:pl-6">
        <div
          id="kurse"
          className={cn("anchor-header-tight", "relative inline-block pr-6 lg:pr-7")}
        >
          {eyebrow ? (
            <p className="mb-2 ml-1 text-xs font-semibold tracking-[0.18em] text-[#7A956E] uppercase lg:text-sm">
              {eyebrow}
            </p>
          ) : null}
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
              "min-h-11 rounded-lg border border-[#6F8B63]/30 bg-[#7A956E] px-6 text-base font-semibold text-white shadow-sm hover:bg-[#6F8B63] hover:text-white",
            )}
          >
            {appCtaLabel}
          </Link>
        </div>
      </div>

      <div className="mt-8 w-full">
        {hasAnyGrid ? (
          <CoursesGrid className={courseGridClass}>
            {sortedCards.map((entry) => (
              <div
                key={entry.type === "series" ? entry.block.series.id : entry.course.id}
                className={courseGridItemClass}
              >
                {entry.type === "series" ? (
                  <YogaflowSeriesCourseCard
                    series={entry.block.series}
                    sessions={entry.block.sessions}
                    appUrl={appUrl}
                  />
                ) : (
                  <CourseRow course={entry.course} />
                )}
              </div>
            ))}
          </CoursesGrid>
        ) : null}

        {!hasAnyGrid ? (
          <p className="text-muted-foreground text-center text-sm">
            Aktuell sind keine Kurse hinterlegt.
          </p>
        ) : null}

        {yogaflowCoursesLoadError ? (
          <p
            className="mt-6 max-w-2xl pl-4 text-sm text-amber-900 lg:pl-6 dark:text-amber-200/90"
            role="status"
          >
            App-Termine sind gerade nicht erreichbar. Bitte später erneut laden oder die Kurse
            direkt in der Buchungs-App prüfen.
          </p>
        ) : null}
      </div>
    </SectionShell>
  );
}
