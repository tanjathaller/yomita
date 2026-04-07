import Link from "next/link";

import type { AktuellesSection as AktuellesModel } from "@/types/site-content";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { ResponsiveSiteImage } from "@/components/shared/responsive-site-image";
import { SectionShell } from "@/components/shared/section-shell";
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
  const isSingleCard = items.length === 1;

  return (
    <SectionShell
      id="aktuelles"
      variant={afterAboutTeaser ? "default" : "muted"}
      containerClassName="lg:max-w-7xl xl:max-w-[88rem]"
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
      <div
        className={cn(
          "mt-10 flex flex-col gap-6",
          "lg:flex-row lg:flex-wrap lg:justify-center lg:gap-6 xl:gap-8",
        )}
      >
        {items.map((item, index) => {
          const customBadge = item.badgeLabel?.trim();
          const badgeLabel = customBadge
            ? customBadge
            : item.title?.toLowerCase().includes("workshop")
              ? "Workshop"
              : DEFAULT_BADGE_LABEL;

          const ctaEnabled = item.cta?.enabled ?? false;
          const ctaLabel = item.cta?.label?.trim();
          const ctaHref = item.cta?.href?.trim();
          const shouldRenderCta = ctaEnabled && Boolean(ctaLabel) && Boolean(ctaHref);
          const isExternalCta = Boolean(ctaHref && /^https?:\/\//i.test(ctaHref));

          return (
            <div
              key={item.id}
              className={cn(
                "flex min-w-0 w-full flex-col",
                isSingleCard
                  ? "lg:flex-[0_0_min(100%,58rem)] xl:flex-[0_0_min(100%,68rem)] 2xl:flex-[0_0_min(100%,76rem)]"
                  : [
                      "lg:flex-[0_0_calc((100%_-_1.5rem)/2)]",
                      "xl:flex-[0_0_calc((100%_-_2rem)/2)]",
                    ],
              )}
            >
              <article
                className={cn(
                  "min-w-0 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm",
                  "lg:rounded-2xl",
                  "transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0",
                  isSingleCard
                    ? "flex h-full w-full flex-col gap-5 p-5 lg:flex-row lg:items-stretch lg:gap-7 lg:p-6 xl:gap-8 xl:p-7"
                    : "h-full w-full",
                )}
              >
                <div
                  className={cn(
                    "relative shrink-0 overflow-hidden bg-muted",
                    isSingleCard
                      ? [
                          "aspect-[4/3] w-full rounded-2xl border border-border/60 shadow-sm",
                          "lg:aspect-[4/5] lg:w-[min(100%,20.25rem)] lg:shrink-0 lg:self-center xl:w-[min(100%,22.5rem)]",
                        ]
                      : "aspect-[4/3] lg:aspect-auto lg:h-[19.5rem]",
                  )}
                >
                  <ResponsiveSiteImage
                    image={item.image}
                    priority={index === 0}
                    preferMobileIfSet={isSingleCard}
                    imgClassName="absolute inset-0 h-full w-full object-cover object-center"
                  />
                  {!isSingleCard ? (
                    <>
                      <div
                        aria-hidden
                        className="absolute inset-x-0 -bottom-px h-14 bg-gradient-to-b from-transparent via-card/30 to-card/85 lg:h-12"
                      />
                      <div
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-1 bg-card"
                      />
                    </>
                  ) : null}
                  <div className="absolute left-4 top-4 lg:left-3 lg:top-3">
                    <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold tracking-widest text-[#7A956E] uppercase shadow-sm backdrop-blur-sm lg:px-2.5 lg:py-0.5">
                      {badgeLabel}
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    "relative",
                    isSingleCard
                      ? "flex min-w-0 flex-1 flex-col justify-center"
                      : "space-y-3 p-6 before:pointer-events-none before:absolute before:inset-x-0 before:-top-5 before:h-5 before:bg-gradient-to-b before:from-card/0 before:to-card/85 lg:min-w-0 lg:space-y-2 lg:px-8 lg:pb-6 lg:pt-5 lg:before:-top-4 lg:before:h-4",
                  )}
                >
                  <div
                    className={cn(
                    isSingleCard
                      ? [
                            "space-y-2.5 rounded-2xl border border-[#D8C9AF]/35 bg-gradient-to-br from-muted/45 via-card to-[#D8C9AF]/[0.12] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45)] lg:space-y-3 lg:p-5 xl:p-6",
                            "ring-1 ring-inset ring-[#2F3B2A]/[0.04]",
                          ]
                        : "contents",
                    )}
                  >
                    {item.title?.trim() ? (
                      <h3
                        className={cn(
                          "text-[#2F3B2A] text-3xl font-semibold tracking-tight",
                          isSingleCard
                            ? "text-[1.55rem] leading-snug lg:text-[1.65rem] xl:text-[1.75rem] xl:leading-snug"
                            : "lg:text-2xl lg:leading-snug xl:text-[1.65rem]",
                        )}
                      >
                        {item.title.trim()}
                      </h3>
                    ) : null}
                    {isSingleCard && item.title?.trim() ? (
                      <span
                        aria-hidden
                        className="block h-1 w-16 max-w-[40%] rounded-full bg-[#D8C9AF]"
                      />
                    ) : null}
                    <div
                      className={cn(
                        "text-muted-foreground leading-relaxed",
                        isSingleCard
                          ? "text-[0.9375rem] leading-snug lg:text-[1rem] lg:leading-[1.45] xl:max-w-none"
                          : "text-base lg:text-sm lg:leading-snug xl:text-[0.95rem]",
                      )}
                    >
                      <MarkdownContent
                        markdown={item.text}
                        className={cn(
                          "max-w-none",
                          isSingleCard
                            ? "space-y-0 [&_p+p]:mt-2 [&_p]:leading-[1.45]"
                            : "space-y-2 lg:space-y-1.5 [&_p]:leading-snug lg:[&_p]:leading-snug",
                        )}
                      />
                    </div>
                    {shouldRenderCta ? (
                      <Link
                        href={ctaHref!}
                        className={cn(
                          "text-primary inline-flex items-center gap-2 font-medium tracking-tight underline-offset-4 transition-colors hover:underline",
                          isSingleCard
                            ? "pt-1 text-lg lg:text-base"
                            : "pt-0.5 text-lg lg:pt-0 lg:text-base",
                        )}
                        target={isExternalCta ? "_blank" : undefined}
                        rel={isExternalCta ? "noopener noreferrer" : undefined}
                      >
                        {ctaLabel}
                        <span aria-hidden>→</span>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
