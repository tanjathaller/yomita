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

function HeaderLeafIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path
        d="M53.5 11.5c-13.5-1.4-25.5 1.8-33.2 9.5C12.8 28.4 9.9 39.3 11.9 51.7c12.4 2 23.3-.9 30.7-8.4 7.7-7.8 10.9-19.7 10.9-31.8z"
        fill="#D5DBD3"
      />
      <path
        d="M19.2 48c8.9-9.3 17.9-16.8 31.2-24.7-6.1 6.1-13.1 15.1-19.2 26.8-4.3 1.1-7.4 1.1-12-.1z"
        fill="#F7F9F5"
        opacity="0.94"
      />
    </svg>
  );
}

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
          ? "-mt-px pt-7 sm:pt-9 md:pt-10"
          : "-mt-px pt-6 sm:pt-7 md:pt-8",
      )}
    >
      <div className="max-w-2xl pl-4 sm:pl-6">
        <div className="relative inline-block pr-6 sm:pr-7">
          <h2 className="text-[#2F3B2A] text-5xl font-semibold tracking-tight sm:text-6xl">
            {heading}
          </h2>
          <span
            aria-hidden
            className="mt-2 ml-3 block h-1 w-28 rounded-full bg-border/80"
          />
          <HeaderLeafIcon className="absolute left-[78%] -top-6 size-8 opacity-75 sm:left-[76%] sm:-top-7 sm:size-9" />
        </div>
      </div>
      {intro?.trim() ? (
        <div className="text-muted-foreground mt-4 max-w-xl pl-3 text-left text-sm leading-relaxed sm:mt-5 sm:pl-4 sm:text-base">
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
