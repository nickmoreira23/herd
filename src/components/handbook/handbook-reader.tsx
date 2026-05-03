"use client";

import { Children, isValidElement, type ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Pencil } from "lucide-react";
import { MermaidDiagram } from "./mermaid-diagram";
import { HandbookCodeBlock } from "./handbook-code-block";
import { HandbookCollapsibleSection } from "./handbook-collapsible-section";
import { HandbookGlossaryTable } from "./handbook-glossary-table";
import { HandbookChangelogTimeline } from "./handbook-changelog-timeline";
import { useSectionState } from "./use-section-state";
import { TODO_PLACEHOLDER_TEXT } from "@/lib/handbook/transform-markdown";
import { splitByH2 } from "@/lib/handbook/split-sections";
import type { HandbookLocale } from "@/lib/handbook/config";

interface Props {
  body: string;
  locale: HandbookLocale;
  /** Entry UID — used to scope localStorage state per entry. */
  uid: string;
}

type CodeProps = ComponentProps<"code"> & { className?: string };
type DivProps = ComponentProps<"div">;
type PreProps = ComponentProps<"pre">;

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
    pre(props: PreProps) {
      // Mermaid blocks are returned by the `code` handler as <MermaidDiagram>
      // — those mustn't be wrapped in a code-block <pre>. For everything
      // else, replace the prose <pre> with a copy-button-aware container.
      const arr = Children.toArray(props.children);
      for (const c of arr) {
        if (isValidElement(c) && c.type === MermaidDiagram) {
          return <>{c}</>;
        }
      }
      return <HandbookCodeBlock>{props.children}</HandbookCodeBlock>;
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

// Tailwind v4 prose modifiers that style fenced code blocks and inline code
// to follow the page's light/dark theme via design tokens (instead of the
// typography plugin's hardcoded near-black `pre` background).
const PROSE_CODE_THEME =
  "prose-pre:bg-muted prose-pre:text-foreground " +
  "prose-pre:border prose-pre:border-border prose-pre:rounded-md " +
  "prose-pre:shadow-none " +
  // Inline code uses a tinted pill in the brand primary color (with low
  // opacity background + full-color text) so identifiers and paths stand
  // out from prose without becoming visually heavy. Theme-aware: the
  // primary token follows the client's brand color.
  "prose-code:bg-primary/15 prose-code:text-primary " +
  "prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded " +
  "prose-code:font-normal prose-code:text-[0.85em] " +
  "prose-code:before:hidden prose-code:after:hidden " +
  // Code inside <pre> resets the inline pill styling — pre itself is the
  // container and we don't want a double background.
  "[&_pre>code]:bg-transparent [&_pre>code]:p-0 [&_pre>code]:text-inherit";

const PROSE_BASE =
  "prose prose-neutral dark:prose-invert max-w-none " + PROSE_CODE_THEME;

function renderSectionContent(
  sectionId: string,
  content: string,
  locale: HandbookLocale,
  components: ReturnType<typeof makeMarkdownComponents>,
) {
  if (sectionId === "glossary") {
    return <HandbookGlossaryTable content={content} locale={locale} />;
  }
  if (sectionId === "changelog") {
    return <HandbookChangelogTimeline content={content} />;
  }
  return (
    <div className={PROSE_BASE}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function HandbookReader({ body, locale, uid }: Props) {
  const { sections } = splitByH2(body);
  const { isOpen, toggle } = useSectionState(uid);
  const components = makeMarkdownComponents(locale);

  // Note: the body's intro (everything before the first H2) is intentionally
  // dropped here. By convention every entry opens with a "canonical /
  // for AI agents" blockquote followed by `# Title` + a description
  // paragraph — all three already exist in the page chrome (footer note +
  // HandbookEntryHeader title/description), so re-rendering them here
  // would duplicate the header.

  // Degenerate case: no H2 sections — render flat.
  if (sections.length === 0) {
    return (
      <article className={PROSE_BASE}>
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
            {renderSectionContent(
              section.id,
              section.content,
              locale,
              components,
            )}
          </HandbookCollapsibleSection>
        ))}
      </div>
    </article>
  );
}
