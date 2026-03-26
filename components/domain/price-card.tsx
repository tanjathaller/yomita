import type { PriceItem } from "@/types/site-content";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PriceCard({ item }: { item: PriceItem }) {
  const highlighted = item.highlighted === true;

  return (
    <Card
      className={cn(
        "border-border/80 shadow-sm transition-shadow",
        highlighted && "border-primary/40 ring-primary/20 shadow-md ring-2"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-[#2F3B2A] text-xl">{item.title}</CardTitle>
        <p className="text-primary text-2xl font-semibold tracking-tight">{item.price}</p>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
      </CardContent>
    </Card>
  );
}
