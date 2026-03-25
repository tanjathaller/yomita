import Image from "next/image";
import { Fragment } from "react";

import type { AktuellesSection as AktuellesModel } from "@/types/site-content";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionShell } from "@/components/shared/section-shell";
import { cn } from "@/lib/utils";

type AktuellesSectionProps = {
  aktuell: AktuellesModel;
  /** Direkt unter dem Kurz-„Über mich“-Block (gleiches Muted-Band wie nach dem Hero). */
  afterAboutTeaser?: boolean;
};

const DEFAULT_TITLE = "Aktuelles";

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
      <SectionHeading eyebrow="Neuigkeiten" title={heading} className="max-w-2xl" />
      {intro?.trim() ? (
        <div className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
          <MarkdownContent markdown={intro} />
        </div>
      ) : null}
      <div className="mt-10 space-y-0">
        {items.map((item, index) => (
          <Fragment key={item.id}>
            {index > 0 ? (
              <div
                className="flex items-center py-7 sm:py-8 md:py-10"
                aria-hidden
              >
                <div className="h-px w-full bg-border/10" />
              </div>
            ) : null}
            <article
              className={cn(
                "grid gap-8 md:grid-cols-2 md:items-center md:gap-10 lg:gap-14",
                index % 2 === 1 && "md:[&>*:first-child]:order-2",
              )}
            >
              <div className="relative aspect-[4/3] max-h-[22rem] overflow-hidden rounded-3xl border border-border/60 bg-muted sm:aspect-[5/4] md:max-h-none md:min-h-[16rem]">
                <Image
                  src={item.image.url}
                  alt={item.image.alt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 42vw, 100vw"
                  priority={index === 0}
                  unoptimized={process.env.NODE_ENV === "development"}
                />
              </div>
              <div className="space-y-3">
                {item.title?.trim() ? (
                  <h3 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
                    {item.title.trim()}
                  </h3>
                ) : null}
                <MarkdownContent markdown={item.text} />
              </div>
            </article>
          </Fragment>
        ))}
      </div>
    </SectionShell>
  );
}
