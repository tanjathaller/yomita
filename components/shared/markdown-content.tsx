import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

import { cn } from "@/lib/utils";

const NEW_WINDOW_LINK_TITLE = "new-window";

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
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        components={{
          a: ({ title, ...props }) => {
            const openInNewTab = title === NEW_WINDOW_LINK_TITLE;
            return (
              <a
                {...props}
                title={openInNewTab ? undefined : title}
                target={openInNewTab ? "_blank" : undefined}
                rel={openInNewTab ? "noopener noreferrer" : undefined}
              />
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
