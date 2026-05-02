"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  /** Raw markdown blockquote (lines beginning with `>`). */
  note: string;
}

/**
 * Footer note for Handbook entries. Hoisted from the body's leading
 * blockquote. Intentionally low-attention: small, light gray, no border,
 * no italic. The text is informational ("this markdown is the canonical
 * form") — it should not compete with content above it.
 */
export function HandbookCanonicalNote({ note }: Props) {
  // Strip the leading `>` markers so prose doesn't render the default
  // blockquote left-rule. We render the cleaned text as a plain paragraph;
  // any inline emphasis (e.g. **bold**) still renders via Markdown.
  const cleaned = note
    .split("\n")
    .map((line) => line.replace(/^>\s?/, ""))
    .join(" ")
    .trim();

  return (
    <aside
      data-handbook-canonical-note
      className="mt-8 pb-4 text-xs text-muted-foreground/60 [&_p]:m-0 [&_strong]:font-semibold"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleaned}</ReactMarkdown>
    </aside>
  );
}
