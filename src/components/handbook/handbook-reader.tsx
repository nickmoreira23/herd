"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Pencil } from "lucide-react";
import { MermaidDiagram } from "./mermaid-diagram";
import { HandbookCollapsibleSection } from "./handbook-collapsible-section";
import { useSectionState } from "./use-section-state";
import { TODO_PLACEHOLDER_TEXT } from "@/lib/handbook/transform-markdown";
import { splitByH2 } from "@/lib/handbook/split-sections";
import type { HandbookLocale } from "@/lib/handbook/config";
import type { ComponentProps } from "react";

interface Props {
  body: string;
  locale: HandbookLocale;
  /** Entry UID — used to scope localStorage state per entry. */
  uid: string;
}

type CodeProps = ComponentProps<"code"> & { className?: string };
type DivProps = ComponentProps<"div">;

function makeMarkdownComponents(locale: HandbookLocale) {
  return {
    code(props: CodeProps) {
      const { className, children, ...rest } = props;
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
    div(props: DivProps) {
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
  };
}

export function HandbookReader({ body, locale, uid }: Props) {
  const { intro, sections } = splitByH2(body);
  const { isOpen, toggle } = useSectionState(uid);
  const components = makeMarkdownComponents(locale);

  // Degenerate case: no H2 sections — render flat.
  if (sections.length === 0) {
    return (
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={components}
        >
          {body}
        </ReactMarkdown>
      </article>
    );
  }

  return (
    <article>
      {intro && (
        <div className="prose prose-neutral dark:prose-invert max-w-none mb-6">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={components}
          >
            {intro}
          </ReactMarkdown>
        </div>
      )}

      <div>
        {sections.map((section) => (
          <HandbookCollapsibleSection
            key={section.id}
            sectionId={section.id}
            title={section.title}
            h3Count={section.h3Count}
            open={isOpen(section.id)}
            onOpenChange={() => toggle(section.id)}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={components}
            >
              {section.content}
            </ReactMarkdown>
          </HandbookCollapsibleSection>
        ))}
      </div>
    </article>
  );
}
