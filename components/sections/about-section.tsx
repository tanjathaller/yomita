import Image from "next/image";

import type { AboutSection as AboutModel } from "@/types/site-content";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { SectionShell } from "@/components/shared/section-shell";
import { isBlobProxyUrl, resolveImageUrl } from "@/lib/resolve-image-url";
import { cn } from "@/lib/utils";

const ABOUT_EYEBROW_FALLBACK = "Kurz zu mir";
const ABOUT_TITLE_FALLBACK = "Über mich";

function getMobileOverlayTitleLines(title: string): { line1: string; line2: string | null } {
  const t = title.trim();
  if (!t) {
    return { line1: ABOUT_TITLE_FALLBACK, line2: null };
  }
  if (t.includes("\n")) {
    const i = t.indexOf("\n");
    const line1 = t.slice(0, i).trim();
    const line2 = t.slice(i + 1).trim();
    return { line1: line1 || ABOUT_TITLE_FALLBACK, line2: line2 || null };
  }
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return { line1: t, line2: null };
  }
  return { line1: words[0]!, line2: words.slice(1).join(" ") };
}

type AboutSectionProps = {
  about: AboutModel;
};

export function AboutSection({ about }: AboutSectionProps) {
  const imageSrc = resolveImageUrl(about.image.url);
  const useUnoptimized = process.env.NODE_ENV === "development" || isBlobProxyUrl(imageSrc);
  const eyebrow = about.eyebrow?.trim() || ABOUT_EYEBROW_FALLBACK;
  const displayTitle = about.title.trim() || ABOUT_TITLE_FALLBACK;
  const mobileTitle = getMobileOverlayTitleLines(about.title);

  return (
    <SectionShell
      id="ueber-mich"
      variant="muted"
      className="-mt-2 pt-12 pb-28 lg:pt-20 lg:pb-40 xl:pb-44 bg-[linear-gradient(to_bottom,var(--surface-muted-band)_0%,var(--surface-muted-band)_68%,color-mix(in_oklab,var(--surface-muted-band)_86%,var(--background)_14%)_80%,color-mix(in_oklab,var(--surface-muted-band)_64%,var(--background)_36%)_90%,color-mix(in_oklab,var(--surface-muted-band)_34%,var(--background)_66%)_97%,var(--background)_100%)]"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-10 xl:grid-cols-[minmax(0,0.93fr)_minmax(0,1.07fr)] xl:gap-14">
        <div className="relative w-[92%] ml-auto lg:w-full">
          {/* Desktop: weicher Farb-Klecks hinter dem Bild */}
          <div
            aria-hidden
            className="pointer-events-none hidden lg:absolute lg:-inset-x-8 lg:-inset-y-6 lg:-z-10 lg:block lg:rounded-[2.75rem] lg:bg-[radial-gradient(ellipse_at_30%_40%,color-mix(in_oklab,var(--primary)_28%,transparent)_0%,color-mix(in_oklab,#D8C9AF_35%,transparent)_45%,transparent_72%)] lg:opacity-90"
          />
          <div className="relative aspect-[4/5] max-h-[26rem] rounded-t-3xl rounded-b-none bg-[var(--surface-muted-band)] outline-none ring-0 lg:max-h-[35rem] lg:-rotate-1 lg:rounded-3xl lg:rounded-br-[2.25rem] lg:shadow-xl lg:shadow-[#2F3B2A]/12 lg:ring-2 lg:ring-[#D8C9AF]/45 xl:max-h-[38rem] xl:ring-[#D8C9AF]/55">
            <div className="absolute inset-[3px] isolate overflow-hidden rounded-t-[calc(1.5rem-3px)] rounded-b-none will-change-transform lg:rounded-[calc(1.5rem-3px)] lg:rounded-br-[2rem]">
              <Image
                src={imageSrc}
                alt={about.image.alt}
                fill
                className="object-cover object-center [transform:translateZ(0)_scale(1.045)]"
                sizes="(min-width: 1280px) 44vw, (min-width: 1024px) 42vw, 100vw"
                priority={false}
                unoptimized={useUnoptimized}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[62%] rounded-t-[calc(1.5rem-3px)] border-2 border-b-0 border-[#2F3B2A] [mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(34,48,34,0.34)] via-[rgba(44,60,43,0.16)] to-[rgba(58,76,56,0.05)]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -bottom-px h-[calc(theme(spacing.28)+2px)] bg-gradient-to-t from-[var(--surface-muted-band)] from-15% via-[color-mix(in_oklab,var(--surface-muted-band)_72%,transparent)] to-transparent lg:h-[calc(theme(spacing.36)+2px)]"
              />
            </div>
          </div>
          <h2 className="pointer-events-none absolute -bottom-[4%] -left-7 z-20 text-[3.2rem] font-bold leading-[0.82] tracking-tight text-[#2F3B2A] drop-shadow-md lg:hidden">
            <span className="block whitespace-nowrap">{mobileTitle.line1}</span>
            {mobileTitle.line2 ? (
              <span className="ml-[0.22em] block whitespace-nowrap">{mobileTitle.line2}</span>
            ) : null}
          </h2>
        </div>
        <div
          className={cn(
            "p-5 lg:w-full lg:max-w-none lg:justify-self-stretch lg:py-6 lg:pl-4 lg:pr-5 xl:pl-5 xl:pr-6",
            /* Desktop: Text wie eine kleine „Karte“, verspielt aber ruhig */
            "lg:relative lg:overflow-hidden lg:rounded-[1.75rem] lg:border lg:border-[#7A956E]/20 lg:bg-[color-mix(in_oklab,var(--background)_55%,var(--surface-muted-band)_45%)] lg:px-9 lg:py-6 lg:shadow-md lg:shadow-[#2F3B2A]/[0.06] lg:transition-[box-shadow,transform] lg:duration-300 lg:ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:lg:hover:-translate-y-0.5 lg:hover:shadow-lg lg:hover:shadow-[#2F3B2A]/[0.09] motion-reduce:lg:hover:translate-y-0 xl:rounded-[2rem] xl:px-10 xl:py-7",
          )}
        >
          <header className="relative z-[1] hidden lg:mb-5 lg:block">
            <p className="mb-1.5 ml-0.5 text-xs font-semibold tracking-[0.18em] text-[#7A956E] uppercase xl:text-sm">
              {eyebrow}
            </p>
            <span
              aria-hidden
              className="ml-1 mb-3.5 block h-1 w-20 rounded-full bg-[#D8C9AF] lg:w-24"
            />
            <h2 className="font-heading text-balance whitespace-pre-line text-[2.35rem] font-bold leading-[1.05] tracking-tight text-[#2F3B2A] xl:text-[2.65rem]">
              {displayTitle}
            </h2>
          </header>
          <MarkdownContent
            markdown={about.text}
            className={cn(
              "max-lg:max-w-prose lg:max-w-none",
              "lg:space-y-3",
              "[&_strong]:font-bold",
              "[&_p:first-of-type]:lg:-ml-px [&_p:first-of-type]:lg:border-l-[3px] [&_p:first-of-type]:lg:border-[#7A956E]/35 [&_p:first-of-type]:lg:pl-5 [&_p:first-of-type]:lg:text-xl [&_p:first-of-type]:lg:font-medium [&_p:first-of-type]:lg:leading-snug [&_p:first-of-type]:lg:text-[#2F3B2A]",
              "[&_p]:lg:text-foreground/90 [&_p]:lg:text-[1.05rem] [&_p]:lg:leading-snug",
              "[&_h2]:lg:text-[1.35rem] [&_h2]:lg:mt-7",
            )}
          />
        </div>
      </div>
    </SectionShell>
  );
}
