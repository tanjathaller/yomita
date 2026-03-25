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
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        <div className="relative aspect-[4/5] max-h-[28rem] overflow-hidden rounded-3xl border border-border/60 bg-muted">
          <Image
            src={about.image.url}
            alt={about.image.alt}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 40vw, 100vw"
            priority={false}
            unoptimized={process.env.NODE_ENV === "development"}
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            {about.title}
          </h2>
          <MarkdownContent markdown={about.text} />
        </div>
      </div>
    </SectionShell>
  );
}
