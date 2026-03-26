import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  className?: string;
};

export function SectionHeading({ eyebrow, title, className }: SectionHeadingProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {eyebrow ? (
        <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-[#2F3B2A] text-4xl font-semibold tracking-tight sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}
