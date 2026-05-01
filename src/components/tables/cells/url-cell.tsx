"use client";

import { useState, useRef, useEffect } from "react";
import { useT } from "@/lib/i18n/locale-context";
import type { CellRendererProps, CellEditorProps } from "./index";

export function UrlCellRenderer({ value, field }: CellRendererProps) {
  const text = value != null ? String(value) : "";
  if (!text) {
    return <span className="text-muted-foreground/40 text-sm">{"—"}</span>;
  }

  const isUrl = field.type === "url";
  if (isUrl) {
    return (
      <a
        href={text}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-500 hover:underline truncate block"
        title={text}
        onClick={(e) => e.stopPropagation()}
      >
        {text}
      </a>
    );
  }

  // Email
  return (
    <a
      href={`mailto:${text}`}
      className="text-sm text-blue-500 hover:underline truncate block"
      title={text}
      onClick={(e) => e.stopPropagation()}
    >
      {text}
    </a>
  );
}

export function UrlCellEditor({
  value,
  field,
  onChange,
  onCommit,
  onCancel,
}: CellEditorProps) {
  const t = useT();
  const [text, setText] = useState(value != null ? String(value) : "");
  const isEmail = field.type === "email";
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onCancel();
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      onChange(text || null);
      onCommit();
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        onChange(text || null);
        onCommit();
      }}
      onKeyDown={handleKeyDown}
      aria-label={
        isEmail
          ? t("tables.cells.url.aria_label_email")
          : t("tables.cells.url.aria_label_url")
      }
      className="w-full h-full text-sm border-0 bg-transparent outline-none focus:ring-1 focus:ring-primary rounded px-1.5"
    />
  );
}
