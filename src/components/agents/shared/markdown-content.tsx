"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        code: ({ children, className }) => {
          const isInline = !className;
          return isInline ? (
            <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono">
              {children}
            </code>
          ) : (
            <code className="block bg-muted p-2 rounded-md text-[11px] font-mono overflow-x-auto mb-2">
              {children}
            </code>
          );
        },
        h1: ({ children }) => (
          <h1 className="font-bold text-sm mb-1">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="font-bold text-xs mb-1">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="font-semibold text-xs mb-1">{children}</h3>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2">
            <table className="w-full text-[11px] border-collapse">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="text-left py-1 pr-3 font-semibold">{children}</th>
        ),
        td: ({ children }) => <td className="py-1 pr-3">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
