import type { PriceItem } from "@/types/site-content";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PriceCard({ item }: { item: PriceItem }) {
  const hasPrice = item.price.trim().length > 0;
  const hasDescription = item.description.trim().length > 0;
  const hasLink = Boolean(item.linkUrl);
  const isExternalLink = item.linkUrl?.startsWith("http");

  return (
    <Card
      className={cn(
        "border-primary/20 bg-[color-mix(in_oklab,var(--surface-muted-band)_62%,var(--background)_38%)] shadow-sm transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-md"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground text-lg leading-snug sm:text-xl">
          {item.title}
        </CardTitle>
        {hasLink ? (
          <a
            href={item.linkUrl}
            target={isExternalLink ? "_blank" : undefined}
            rel={isExternalLink ? "noreferrer noopener" : undefined}
            className="text-primary mt-2 inline-flex w-fit rounded-full border border-primary/25 bg-transparent px-3 py-1 text-base font-semibold tracking-tight underline-offset-4 transition-colors hover:border-primary/35 hover:underline"
          >
            {item.linkLabel || item.price || "Mehr erfahren"}
          </a>
        ) : hasPrice ? (
          <p className="text-primary mt-2 inline-flex w-fit rounded-full border border-primary/25 bg-transparent px-3 py-1 text-base font-semibold tracking-tight">
            {item.price}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        {hasDescription ? (
          hasLink && !hasPrice && !item.linkLabel ? (
            <a
              href={item.linkUrl}
              target={isExternalLink ? "_blank" : undefined}
              rel={isExternalLink ? "noreferrer noopener" : undefined}
              className="text-foreground/75 inline-flex whitespace-pre-line text-sm leading-relaxed underline-offset-4 hover:underline"
            >
              {item.description}
            </a>
          ) : (
            <p className="text-foreground/75 whitespace-pre-line text-sm leading-relaxed">
              {item.description}
            </p>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
