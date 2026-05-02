"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Pencil } from "lucide-react";
import { MermaidDiagram } from "./mermaid-diagram";
import { TODO_PLACEHOLDER_TEXT } from "@/lib/handbook/transform-markdown";
import type { HandbookLocale } from "@/lib/handbook/config";

interface Props {
  body: string;
  locale: HandbookLocale;
}

export function HandbookReader({ body, locale }: Props) {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ className, children, ...rest }) {
            const lang = /language-(\w+)/.exec(className ?? "")?.[1];
            if (lang === "mermaid") {
              return <MermaidDiagram chart={String(children).trim()} />;
            }
            return (
              <code className={className} {...rest}>
                {children}
              </code>
            );
          },
          div(props) {
            const { children, ...rest } = props;
            const isTodo =
              (rest as Record<string, unknown>)["data-handbook-todo"] === "true";
            if (isTodo) {
              return (
                <div className="my-4 p-3 border-l-2 border-muted-foreground/30 bg-muted/40 rounded-r-md flex items-start gap-2 not-prose">
                  <Pencil className="h-4 w-4 text-muted-foreground/70 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground italic">
                    {TODO_PLACEHOLDER_TEXT[locale]}
                  </span>
                </div>
              );
            }
            return <div {...rest}>{children}</div>;
          },
        }}
      >
        {body}
      </ReactMarkdown>
    </article>
  );
}
