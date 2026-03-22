import Image from "next/image";

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
      variant="muted"
      className={cn(
        afterAboutTeaser
          ? "border-border/40 border-t pt-12 sm:pt-14 md:pt-16"
          : "-mt-px pt-8 sm:pt-10 md:pt-12",
      )}
    >
      <SectionHeading eyebrow="Neuigkeiten" title={heading} className="max-w-2xl" />
      {intro?.trim() ? (
        <div className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
          <MarkdownContent markdown={intro} />
        </div>
      ) : null}
      <div className="mt-10 space-y-14 sm:space-y-16 md:space-y-20">
        {items.map((item, index) => (
          <article
            key={item.id}
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
        ))}
      </div>
    </SectionShell>
  );
}
