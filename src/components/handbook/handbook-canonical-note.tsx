"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  /** Raw markdown blockquote (lines beginning with `>`). */
  note: string;
}

/**
 * Footer note for Handbook entries. Hoisted from the body's leading
 * blockquote so the entry header isn't visually competing with a "for AI
 * agents" callout. Rendered small, muted, separated from main content.
 */
export function HandbookCanonicalNote({ note }: Props) {
  return (
    <aside
      data-handbook-canonical-note
      className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground prose prose-sm prose-neutral dark:prose-invert max-w-none"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{note}</ReactMarkdown>
    </aside>
  );
}
