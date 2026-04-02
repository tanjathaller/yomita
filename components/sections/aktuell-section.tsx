import Image from "next/image";
import Link from "next/link";

import type { AktuellesSection as AktuellesModel } from "@/types/site-content";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { SectionShell } from "@/components/shared/section-shell";
import { isBlobProxyUrl, resolveImageUrl } from "@/lib/resolve-image-url";
import { cn } from "@/lib/utils";

type AktuellesSectionProps = {
  aktuell: AktuellesModel;
  /** Direkt unter dem Kurz-„Über mich“-Block (gleiches Muted-Band wie nach dem Hero). */
  afterAboutTeaser?: boolean;
  /** Kleines Label über der Headline (z. B. „Journal“). */
  eyebrowLabel?: string;
};

const DEFAULT_TITLE = "Aktuelles";
const DEFAULT_BADGE_LABEL = "Aktuell";

export function AktuellesSection({
  aktuell,
  afterAboutTeaser = false,
  eyebrowLabel,
}: AktuellesSectionProps) {
  const { items, title, intro } = aktuell;
  if (items.length === 0) {
    return null;
  }

  const heading = title?.trim() || DEFAULT_TITLE;
  const eyebrow = eyebrowLabel?.trim() || "Journal";

  return (
    <SectionShell
      id="aktuelles"
      variant={afterAboutTeaser ? "default" : "muted"}
      className={cn(
        afterAboutTeaser
          ? "pt-7 pb-24 lg:pt-10 lg:pb-34 bg-[linear-gradient(to_bottom,var(--surface-muted-band)_0%,color-mix(in_oklab,var(--surface-muted-band)_62%,var(--background)_38%)_14%,var(--background)_30%,var(--background)_72%,color-mix(in_oklab,var(--background)_74%,var(--surface-muted-band)_26%)_86%,color-mix(in_oklab,var(--background)_44%,var(--surface-muted-band)_56%)_95%,var(--surface-muted-band)_100%)]"
          : "pt-6 lg:pt-8",
      )}
    >
      <div className="max-w-2xl pl-4 lg:pl-6">
        <div className="relative inline-block pr-6 lg:pr-7">
          <p className="mb-2 ml-1 text-xs font-semibold tracking-[0.18em] text-[#5F7F53] uppercase lg:text-sm">
            {eyebrow}
          </p>
          <h2 className="text-[#2F3B2A] text-5xl font-semibold tracking-tight lg:text-6xl">
            {heading}
          </h2>
          <span
            aria-hidden
            className="mt-2 ml-3 block h-1 w-28 rounded-full bg-[#D8C9AF]"
          />
        </div>
      </div>
      {intro?.trim() ? (
        <div className="mt-4 max-w-2xl pl-4 lg:mt-5 lg:pl-6">
          <MarkdownContent
            markdown={intro}
            className={cn(
              "max-w-prose text-left",
              "[&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground lg:[&_p]:text-base",
            )}
          />
        </div>
      ) : null}
      <div className="mt-10 grid gap-6 lg:mx-auto lg:max-w-6xl lg:grid-cols-2 lg:gap-8 xl:max-w-7xl">
        {items.map((item, index) => {
          const customBadge = item.badgeLabel?.trim();
          const badgeLabel = customBadge
            ? customBadge
            : item.title?.toLowerCase().includes("workshop")
              ? "Workshop"
              : DEFAULT_BADGE_LABEL;

          const imageSrc = resolveImageUrl(item.image.url);
          const useUnoptimized = process.env.NODE_ENV === "development" || isBlobProxyUrl(imageSrc);
          const ctaEnabled = item.cta?.enabled ?? false;
          const ctaLabel = item.cta?.label?.trim();
          const ctaHref = item.cta?.href?.trim();
          const shouldRenderCta = ctaEnabled && Boolean(ctaLabel) && Boolean(ctaHref);
          const isExternalCta = Boolean(ctaHref && /^https?:\/\//i.test(ctaHref));

          return (
          <article
            key={item.id}
            className={cn(
              "overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm",
              "transition-shadow duration-200 hover:shadow-md",
            )}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <Image
                src={imageSrc}
                alt={item.image.alt}
                fill
                className="object-cover object-center"
                sizes="(min-width: 1024px) 45vw, (min-width: 640px) 90vw, 100vw"
                priority={index === 0}
                unoptimized={useUnoptimized}
              />
              <div
                aria-hidden
                className="absolute inset-x-0 -bottom-px h-14 bg-gradient-to-b from-transparent via-card/30 to-card/85"
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1 bg-card"
              />
              <div className="absolute left-4 top-4">
                <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold tracking-widest text-[#7A956E] uppercase shadow-sm backdrop-blur-sm">
                  {badgeLabel}
                </span>
              </div>
            </div>
            <div className="relative space-y-4 p-7 lg:p-12 before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-b before:from-card/0 before:to-card/85">
              {item.title?.trim() ? (
                <h3 className="text-[#2F3B2A] text-3xl font-semibold tracking-tight lg:text-4xl xl:text-[2.5rem]">
                  {item.title.trim()}
                </h3>
              ) : null}
              <div className="text-muted-foreground text-base leading-relaxed lg:text-lg">
                <MarkdownContent markdown={item.text} />
              </div>
              {shouldRenderCta ? (
                <Link
                  href={ctaHref!}
                  className="text-primary inline-flex items-center gap-2 pt-1 text-lg font-medium tracking-tight underline-offset-4 transition-colors hover:underline"
                  target={isExternalCta ? "_blank" : undefined}
                  rel={isExternalCta ? "noopener noreferrer" : undefined}
                >
                  {ctaLabel}
                  <span aria-hidden>→</span>
                </Link>
              ) : null}
            </div>
          </article>
          );
        })}
      </div>
    </SectionShell>
  );
}
