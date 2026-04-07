import type { PriceItem } from "@/types/site-content";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Leicht eingebettet in die Karte: kein heller Fill, kein Inset-Glanz (wirkt sonst wie „weißer Klotz“). */
const priceChipClass =
  "text-primary mt-3 inline-flex w-fit max-w-full rounded-full border border-primary/30 bg-transparent px-3 py-1.5 text-base font-semibold tracking-tight transition-colors duration-200 hover:border-primary/45 hover:bg-primary/[0.06]";

export function PriceCard({ item }: { item: PriceItem }) {
  const hasPrice = item.price.trim().length > 0;
  const hasDescription = item.description.trim().length > 0;
  const hasLink = Boolean(item.linkUrl);
  const isExternalLink = item.linkUrl?.startsWith("http");

  const highlighted = Boolean(item.highlighted);

  return (
    <Card
      className={cn(
        "group/price relative h-full w-full min-w-0 overflow-hidden border-primary/20 bg-[color-mix(in_oklab,var(--surface-muted-band)_62%,var(--background)_38%)] shadow-sm transition-[box-shadow,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-primary/30 hover:shadow-md",
        hasDescription && "gap-0",
        highlighted &&
          "border-[#6F8B63]/45 shadow-md shadow-[#2F3B2A]/10 ring-2 ring-[#7A956E]/35 hover:border-[#6F8B63]/55 hover:ring-[#7A956E]/45",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-[#6F8B63]/35 to-transparent",
          highlighted && "h-1 rounded-none bg-gradient-to-r from-[#5C7554] via-[#7A956E] to-[#8FA882] shadow-[0_1px_0_0_color-mix(in_oklab,#2F3B2A_12%,transparent)]",
        )}
      />
      {highlighted ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-8 size-36 rounded-full bg-[#7A956E]/[0.14] blur-3xl motion-reduce:blur-none motion-reduce:opacity-40"
        />
      ) : null}

      <CardHeader
        className={cn("relative z-[2] pb-2", hasDescription && "pb-0")}
      >
        <CardTitle className="text-[#2F3B2A] text-lg font-semibold leading-snug tracking-tight lg:text-xl">
          {item.title}
        </CardTitle>
        {hasLink ? (
          <a
            href={item.linkUrl}
            target={isExternalLink ? "_blank" : undefined}
            rel={isExternalLink ? "noreferrer noopener" : undefined}
            className={cn(priceChipClass, "underline-offset-4 hover:underline")}
          >
            {item.price.trim() ? item.price : "Mehr erfahren"}
          </a>
        ) : hasPrice ? (
          <p className={priceChipClass}>{item.price}</p>
        ) : null}
        {hasDescription ? (
          <div
            aria-hidden
            className="mx-2 mt-3 h-1 shrink-0 rounded-full bg-[#2F3B2A]/10"
          />
        ) : null}
      </CardHeader>
      {hasDescription ? (
        <CardContent className="relative z-[2] min-w-0 pt-3">
          <MarkdownContent
            markdown={item.description}
            className={cn(
              "!space-y-2 text-foreground/75 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-foreground/75 lg:[&_p]:text-base",
              "[&_li]:text-foreground/75 [&_ul]:text-sm [&_ol]:text-sm",
              "[&_a]:text-primary [&_a]:font-medium [&_a]:underline-offset-4 hover:[&_a]:underline",
            )}
          />
        </CardContent>
      ) : null}
    </Card>
  );
}
