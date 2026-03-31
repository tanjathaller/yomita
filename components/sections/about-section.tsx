import Image from "next/image";

import type { AboutSection as AboutModel } from "@/types/site-content";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { SectionShell } from "@/components/shared/section-shell";
import { isBlobProxyUrl, resolveImageUrl } from "@/lib/resolve-image-url";

type AboutSectionProps = {
  about: AboutModel;
};

export function AboutSection({ about }: AboutSectionProps) {
  const imageSrc = resolveImageUrl(about.image.url);
  const useUnoptimized = process.env.NODE_ENV === "development" || isBlobProxyUrl(imageSrc);

  return (
    <SectionShell
      id="ueber-mich"
      variant="muted"
      className="-mt-2 pt-12 pb-28 lg:pt-20 lg:pb-40 xl:pb-44 bg-[linear-gradient(to_bottom,var(--surface-muted-band)_0%,var(--surface-muted-band)_68%,color-mix(in_oklab,var(--surface-muted-band)_86%,var(--background)_14%)_80%,color-mix(in_oklab,var(--surface-muted-band)_64%,var(--background)_36%)_90%,color-mix(in_oklab,var(--surface-muted-band)_34%,var(--background)_66%)_97%,var(--background)_100%)]"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16 xl:gap-24">
        <div className="relative w-[92%] ml-auto lg:w-full">
          <div className="relative aspect-[4/5] max-h-[26rem] rounded-t-3xl rounded-b-none bg-[var(--surface-muted-band)] outline-none ring-0 lg:max-h-[30rem] xl:max-h-[32rem]">
            <div className="absolute inset-[3px] overflow-hidden rounded-t-[calc(1.5rem-3px)] rounded-b-none">
              <Image
                src={imageSrc}
                alt={about.image.alt}
                fill
                className="object-cover scale-[1.015]"
                sizes="(min-width: 1024px) 40vw, 100vw"
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
                className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--surface-muted-band)] via-[color-mix(in_oklab,var(--surface-muted-band)_70%,transparent)] to-transparent lg:h-36"
              />
            </div>
          </div>
          <h2 className="pointer-events-none absolute -bottom-[4%] -left-7 z-20 text-[3.2rem] font-bold leading-[0.82] tracking-tight text-[#2F3B2A] drop-shadow-md lg:-left-9 lg:-bottom-[3%] lg:text-[3.95rem] xl:text-[4.15rem]">
            <span className="block whitespace-nowrap">Über</span>
            <span className="ml-[0.22em] block whitespace-nowrap">mich</span>
          </h2>
        </div>
        <div className="p-5 lg:p-8 xl:max-w-xl xl:justify-self-start">
          <MarkdownContent
            markdown={about.text}
            className="[&_strong]:font-bold"
          />
        </div>
      </div>
    </SectionShell>
  );
}
