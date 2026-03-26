import Image from "next/image";
import Link from "next/link";

import type { AktuellesSection as AktuellesModel } from "@/types/site-content";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { SectionShell } from "@/components/shared/section-shell";
import { cn } from "@/lib/utils";

type AktuellesSectionProps = {
  aktuell: AktuellesModel;
  /** Direkt unter dem Kurz-„Über mich“-Block (gleiches Muted-Band wie nach dem Hero). */
  afterAboutTeaser?: boolean;
};

const DEFAULT_TITLE = "Aktuelles";
const DEFAULT_BADGE_LABEL = "Aktuell";

export function AktuellesSection({
  aktuell,
  afterAboutTeaser = false,
}: AktuellesSectionProps) {
  const { items, title, intro } = aktuell;
  if (items.length === 0) {
    return null;
  }

  const heading = title?.trim() || DEFAULT_TITLE;

  return (
    <SectionShell
      id="aktuelles"
      variant={afterAboutTeaser ? "default" : "muted"}
      waveInto="muted-band"
      className={cn(
        afterAboutTeaser
          ? "-mt-px pt-10 sm:pt-12 md:pt-14"
          : "-mt-px pt-7 sm:pt-9 md:pt-10",
      )}
    >
      <div className="max-w-2xl text-center">
        <h2 className="text-[#2F3B2A] text-4xl font-semibold tracking-tight sm:text-5xl">
          {heading}
        </h2>
        <span
          aria-hidden
          className="mx-auto mt-4 block h-0.5 w-16 bg-border/70"
        />
      </div>
      {intro?.trim() ? (
        <div className="text-muted-foreground mt-6 max-w-xl text-center text-sm leading-relaxed sm:mt-7 sm:text-base">
          <MarkdownContent
            markdown={intro}
            className="max-w-none [&_p]:italic [&_p]:leading-relaxed [&_p]:text-muted-foreground"
          />
        </div>
      ) : null}
      <div className="mt-10 grid gap-6 md:gap-8">
        {items.map((item, index) => {
          const badgeLabel = item.title?.toLowerCase().includes("workshop")
            ? "Workshop"
            : DEFAULT_BADGE_LABEL;

          return (
          <article
            key={item.id}
            className={cn(
              "overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm",
              "transition-shadow duration-200 hover:shadow-md",
            )}
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-muted">
              <Image
                src={item.image.url}
                alt={item.image.alt}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 58rem, (min-width: 640px) 90vw, 100vw"
                priority={index === 0}
                unoptimized={process.env.NODE_ENV === "development"}
              />
              <div className="absolute left-4 top-4">
                <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold tracking-widest text-[#7A956E] uppercase shadow-sm backdrop-blur-sm">
                  {badgeLabel}
                </span>
              </div>
            </div>
            <div className="space-y-4 p-6 sm:p-8">
              {item.title?.trim() ? (
                <h3 className="text-[#2F3B2A] text-3xl font-semibold tracking-tight sm:text-4xl">
                  {item.title.trim()}
                </h3>
              ) : null}
              <div className="text-muted-foreground text-base leading-relaxed sm:text-lg">
                <MarkdownContent markdown={item.text} />
              </div>
              <Link
                href="/#kontakt"
                className="text-primary inline-flex items-center gap-2 pt-1 text-lg font-medium tracking-tight underline-offset-4 transition-colors hover:underline"
              >
                Details ansehen
                <span aria-hidden>→</span>
              </Link>
            </div>
          </article>
          );
        })}
      </div>
    </SectionShell>
  );
}
