import type { PriceItem } from "@/types/site-content";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PriceCard({ item }: { item: PriceItem }) {
  const hasPrice = item.price.trim().length > 0;
  const hasDescription = item.description.trim().length > 0;
  const hasLink = Boolean(item.linkUrl);
  const isExternalLink = item.linkUrl?.startsWith("http");

  const highlighted = Boolean(item.highlighted);

  return (
    <Card
      className={cn(
        "h-full w-full min-w-0 border-primary/20 bg-[color-mix(in_oklab,var(--surface-muted-band)_62%,var(--background)_38%)] shadow-sm transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-md",
        highlighted &&
          "relative border-[#6F8B63]/45 shadow-md shadow-[#2F3B2A]/10 ring-2 ring-[#7A956E]/35 hover:border-[#6F8B63]/55 hover:ring-[#7A956E]/45",
      )}
    >
      <CardHeader className={cn("pb-2", highlighted && "pt-1")}>
        {highlighted ? (
          <p className="text-primary mb-2 text-xs font-semibold tracking-wide">Empfehlung</p>
        ) : null}
        <CardTitle className="text-foreground text-lg leading-snug lg:text-xl">
          {item.title}
        </CardTitle>
        {hasLink ? (
          <a
            href={item.linkUrl}
            target={isExternalLink ? "_blank" : undefined}
            rel={isExternalLink ? "noreferrer noopener" : undefined}
            className="text-primary mt-2 inline-flex w-fit rounded-full border border-primary/25 bg-transparent px-3 py-1 text-base font-semibold tracking-tight underline-offset-4 transition-colors hover:border-primary/35 hover:underline"
          >
            {item.price.trim() ? item.price : "Mehr erfahren"}
          </a>
        ) : hasPrice ? (
          <p className="text-primary mt-2 inline-flex w-fit rounded-full border border-primary/25 bg-transparent px-3 py-1 text-base font-semibold tracking-tight">
            {item.price}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="min-w-0 pt-0">
        {hasDescription ? (
          <MarkdownContent
            markdown={item.description}
            className={cn(
              "!space-y-2 text-foreground/75 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-foreground/75 lg:[&_p]:text-base",
              "[&_li]:text-foreground/75 [&_ul]:text-sm [&_ol]:text-sm",
              "[&_a]:text-primary [&_a]:font-medium [&_a]:underline-offset-4 hover:[&_a]:underline",
            )}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
