import Image from "next/image";

import type { AboutSection as AboutModel } from "@/types/site-content";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { SectionShell } from "@/components/shared/section-shell";

type AboutSectionProps = {
  about: AboutModel;
};

export function AboutSection({ about }: AboutSectionProps) {
  return (
    <SectionShell
      id="ueber-mich"
      variant="muted"
      waveInto="background"
      className="-mt-2 pt-12 sm:pt-20"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div className="relative w-[92%] ml-auto lg:w-full">
          <div className="relative aspect-[4/5] max-h-[26rem] overflow-hidden rounded-3xl bg-muted sm:max-h-[28rem]">
            <Image
              src={about.image.url}
              alt={about.image.alt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 40vw, 100vw"
              priority={false}
              unoptimized={process.env.NODE_ENV === "development"}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(34,48,34,0.34)] via-[rgba(44,60,43,0.16)] to-[rgba(58,76,56,0.05)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--surface-muted-band)] via-[color-mix(in_oklab,var(--surface-muted-band)_70%,transparent)] to-transparent sm:h-32"
            />
          </div>
          <h2 className="pointer-events-none absolute -bottom-[4%] -left-7 z-20 text-[3.2rem] font-bold leading-[0.82] tracking-tight text-[#2F3B2A] drop-shadow-md sm:-left-8 sm:-bottom-[4%] sm:text-[3.95rem] md:-left-9 md:-bottom-[3%]">
            <span className="block whitespace-nowrap">Über</span>
            <span className="ml-[0.22em] block whitespace-nowrap">mich</span>
          </h2>
        </div>
        <div className="rounded-3xl bg-background/80 p-5 shadow-sm backdrop-blur-sm sm:p-7">
          <MarkdownContent markdown={about.text} />
        </div>
      </div>
    </SectionShell>
  );
}
