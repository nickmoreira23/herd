"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

/**
 * Wrapper for fenced markdown code blocks. Adds a copy button on the
 * top-right that becomes visible on hover, theme-aware (bg-muted +
 * text-foreground, no hardcoded dark background). Replaces the
 * typography plugin's default <pre> styling.
 */
export function HandbookCodeBlock({ children }: Props) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    const text = ref.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard write can fail in insecure contexts; silent — the copy
      // button is a convenience, the code is still selectable manually.
    }
  }

  return (
    <div className="relative group not-prose my-4">
      <pre
        ref={ref}
        className="bg-muted text-foreground border border-border rounded-md px-4 py-3 overflow-x-auto text-sm font-mono leading-relaxed"
      >
        {children}
      </pre>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? "Copied" : "Copy"}
        className={[
          "absolute top-2 right-2",
          "inline-flex items-center justify-center h-7 w-7 rounded-md",
          "bg-card border border-border text-muted-foreground",
          "hover:text-foreground hover:bg-accent transition-all",
          copied ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        ].join(" ")}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
