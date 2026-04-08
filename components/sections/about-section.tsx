import type { AboutSection as AboutModel } from "@/types/site-content";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { ResponsiveSiteImage } from "@/components/shared/responsive-site-image";
import { SectionShell } from "@/components/shared/section-shell";
import { cn } from "@/lib/utils";

const ABOUT_EYEBROW_FALLBACK = "Kurz zu mir";
const ABOUT_TITLE_FALLBACK = "Über mich";

type AboutSectionProps = {
  about: AboutModel;
};

export function AboutSection({ about }: AboutSectionProps) {
  const eyebrow = about.eyebrow?.trim() || ABOUT_EYEBROW_FALLBACK;
  const displayTitle = about.title.trim() || ABOUT_TITLE_FALLBACK;

  return (
    <SectionShell
      id="ueber-mich"
      variant="muted"
      className="-mt-2 pt-12 pb-28 lg:pt-20 lg:pb-40 xl:pb-44 bg-[linear-gradient(to_bottom,var(--surface-muted-band)_0%,var(--surface-muted-band)_68%,color-mix(in_oklab,var(--surface-muted-band)_86%,var(--background)_14%)_80%,color-mix(in_oklab,var(--surface-muted-band)_64%,var(--background)_36%)_90%,color-mix(in_oklab,var(--surface-muted-band)_34%,var(--background)_66%)_97%,var(--background)_100%)]"
    >
      <div className="grid min-w-0 w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center lg:gap-10 xl:grid-cols-[minmax(0,0.93fr)_minmax(0,1.07fr)] xl:gap-14">
        <div className="relative flex w-full min-w-0 justify-center lg:block">
          {/* Desktop: weicher Farb-Klecks hinter dem Bild */}
          <div
            aria-hidden
            className="pointer-events-none hidden lg:absolute lg:-inset-x-8 lg:-inset-y-6 lg:-z-10 lg:block lg:rounded-[2.75rem] lg:bg-[radial-gradient(ellipse_at_30%_40%,color-mix(in_oklab,var(--primary)_28%,transparent)_0%,color-mix(in_oklab,#D8C9AF_35%,transparent)_45%,transparent_72%)] lg:opacity-90"
          />
          <div
            data-about-portrait
            className="relative aspect-[19/30] max-h-[31rem] w-full max-w-md shrink-0 rounded-t-3xl rounded-b-none border-0 bg-[var(--surface-muted-band)] outline-none ring-0 lg:max-h-[41rem] lg:w-full lg:max-w-none lg:-rotate-1 lg:rounded-3xl lg:rounded-br-[2.25rem] lg:shadow-xl lg:shadow-[#2F3B2A]/12 lg:ring-2 lg:ring-[#D8C9AF]/45 xl:max-h-[45rem] xl:ring-[#D8C9AF]/55"
          >
              <div className="absolute inset-0 isolate overflow-hidden rounded-t-3xl rounded-b-none border-0 will-change-transform lg:inset-[3px] lg:rounded-[calc(1.5rem-3px)] lg:rounded-br-[2rem]">
                <ResponsiveSiteImage
                  image={about.image}
                  pictureClassName="block h-full min-h-0 w-full border-0"
                  imgClassName="absolute inset-0 block h-full w-full border-0 object-cover object-top"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-[62%] rounded-t-3xl border-0 border-t-2 border-[#2F3B2A] [mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)] lg:rounded-t-[calc(1.5rem-3px)]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 border-0 bg-gradient-to-t from-[rgba(34,48,34,0.34)] via-[rgba(44,60,43,0.16)] to-[rgba(58,76,56,0.05)]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[calc(theme(spacing.28)+2px)] border-0 bg-gradient-to-t from-[var(--surface-muted-band)] from-15% via-[color-mix(in_oklab,var(--surface-muted-band)_72%,transparent)] to-transparent lg:h-[calc(theme(spacing.36)+2px)]"
                />
              </div>
          </div>
        </div>
        <div
          className={cn(
            "relative min-w-0 w-full justify-self-stretch overflow-hidden rounded-[1.5rem] border border-[#7A956E]/20 bg-[color-mix(in_oklab,var(--background)_55%,var(--surface-muted-band)_45%)] p-5 shadow-md shadow-[#2F3B2A]/[0.06] transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-6 lg:rounded-[1.75rem] lg:px-9 lg:py-6 motion-safe:lg:hover:-translate-y-0.5 lg:hover:shadow-lg lg:hover:shadow-[#2F3B2A]/[0.09] motion-reduce:lg:hover:translate-y-0 xl:rounded-[2rem] xl:px-10 xl:py-7",
            "lg:py-6 lg:pl-4 lg:pr-5 xl:pl-5 xl:pr-6",
          )}
        >
            <header className="relative z-[1] mb-4 lg:mb-5">
              <p className="mb-1.5 ml-0.5 text-xs font-semibold tracking-[0.18em] text-[#7A956E] uppercase xl:text-sm">
                {eyebrow}
              </p>
              <span
                aria-hidden
                className="ml-1 mb-3 block h-1 w-20 rounded-full bg-[#D8C9AF] lg:mb-3.5 lg:w-24"
              />
              <h2 className="font-heading text-balance whitespace-pre-line text-[1.85rem] font-bold leading-[1.08] tracking-tight text-[#2F3B2A] sm:text-[2rem] lg:text-[2.35rem] lg:leading-[1.05] xl:text-[2.65rem]">
                {displayTitle}
              </h2>
            </header>
            <MarkdownContent
              markdown={about.text}
              className={cn(
                "max-w-none lg:max-w-none",
                "space-y-4 lg:space-y-3",
                "[&_strong]:font-bold",
                "[&_p:first-of-type]:-ml-px [&_p:first-of-type]:border-l-[3px] [&_p:first-of-type]:border-[#7A956E]/35 [&_p:first-of-type]:pl-4 [&_p:first-of-type]:text-lg [&_p:first-of-type]:font-medium [&_p:first-of-type]:leading-snug [&_p:first-of-type]:text-[#2F3B2A] [&_p:first-of-type]:lg:pl-5 [&_p:first-of-type]:lg:text-xl",
                "[&_p]:text-foreground/90 [&_p]:leading-relaxed [&_p]:lg:text-[1.05rem] [&_p]:lg:leading-snug",
                "[&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:lg:mt-7 [&_h2]:lg:text-[1.35rem]",
              )}
            />
        </div>
      </div>
    </SectionShell>
  );
}
