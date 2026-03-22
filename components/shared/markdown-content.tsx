import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  markdown: string;
  className?: string;
};

/** Renderer für `legal.*` und optionales Markdown in Sektionen (vgl. content-model.md). */
export function MarkdownContent({ markdown, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "max-w-prose space-y-4 text-pretty text-foreground [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:leading-relaxed [&_strong]:font-semibold",
        className
      )}
    >
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
