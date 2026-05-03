"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  parseGlossary,
  type GlossaryEntry,
} from "@/lib/handbook/parse-bullet-sections";
import type { HandbookLocale } from "@/lib/handbook/config";

interface Props {
  content: string;
  locale: HandbookLocale;
}

/**
 * Render a Glossary section's bullet list as a clean two-column table.
 * Falls back to default markdown if no entries match the convention
 * (`- **Term**: Definition`).
 */
export function HandbookGlossaryTable({ content, locale }: Props) {
  const entries: GlossaryEntry[] = parseGlossary(content);

  if (entries.length === 0) {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  const headers = locale === "pt-BR"
    ? { term: "Termo", definition: "Definição" }
    : { term: "Term", definition: "Definition" };

  return (
    <div className="not-prose mt-2 overflow-hidden rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left font-semibold px-4 py-2 w-1/3 border-b border-border">
              {headers.term}
            </th>
            <th className="text-left font-semibold px-4 py-2 border-b border-border">
              {headers.definition}
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, idx) => (
            <tr
              key={idx}
              className="border-b border-border last:border-0 align-top"
            >
              <td className="px-4 py-2 font-medium text-foreground">
                {e.term}
              </td>
              <td className="px-4 py-2 text-muted-foreground">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <span>{children}</span>,
                    code: ({ children }) => (
                      <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {e.definition}
                </ReactMarkdown>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
