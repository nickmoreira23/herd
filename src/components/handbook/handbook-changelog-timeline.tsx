"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  parseChangelog,
  type ChangelogEntry,
} from "@/lib/handbook/parse-bullet-sections";

interface Props {
  content: string;
}

/**
 * Render a Changelog section's bullet list as a vertical timeline.
 * Each entry is `- **DATE** — Description`. Falls back to default
 * markdown when no entries match the convention.
 */
export function HandbookChangelogTimeline({ content }: Props) {
  const entries: ChangelogEntry[] = parseChangelog(content);

  if (entries.length === 0) {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <ol className="not-prose relative mt-2 ml-2 space-y-6">
      {entries.map((e, idx) => (
        <li key={idx} className="pl-6 relative">
          {/* Connector line — only drawn between items, never after the last
              one (so a single-entry timeline shows just the dot). The line
              starts at the dot and extends through the gap to the next
              dot's vertical position. */}
          {idx < entries.length - 1 && (
            <span
              aria-hidden
              className="absolute left-0 top-2 -bottom-6 w-px bg-border"
            />
          )}
          {/* Dot marker */}
          <span
            aria-hidden
            className="absolute -left-[3px] top-1.5 h-2 w-2 rounded-full bg-foreground ring-4 ring-background"
          />
          <div className="text-xs font-mono text-muted-foreground tracking-wide">
            {e.date}
          </div>
          <div className="text-sm text-foreground mt-0.5">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <span>{children}</span>,
                code: ({ children }) => (
                  <code className="bg-primary/15 text-primary px-1.5 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="underline hover:text-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {e.description}
            </ReactMarkdown>
          </div>
        </li>
      ))}
    </ol>
  );
}
