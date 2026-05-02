"use client";

import { useState, useRef, useEffect } from "react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { formatDate } from "@/lib/i18n/format-date";
import type { CellRendererProps, CellEditorProps } from "./index";

export function DateCellRenderer({ value, field }: CellRendererProps) {
  const locale = useLocale();
  if (!value) {
    return <span className="text-muted-foreground/40 text-sm">{"—"}</span>;
  }
  const date = new Date(String(value));
  const isValid = !isNaN(date.getTime());
  const preset =
    field.type === "createdTime" || field.type === "lastModifiedTime"
      ? "dateTime"
      : "short";
  const formatted = isValid ? formatDate(date, locale, preset) : String(value);
  return (
    <span className="text-sm" title={String(value)}>
      {formatted}
    </span>
  );
}

export function DateCellEditor({
  value,
  onChange,
  onCommit,
  onCancel,
}: CellEditorProps) {
  const t = useT();
  const [dateStr, setDateStr] = useState(() => {
    if (!value) return "";
    const d = new Date(String(value));
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onCancel();
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      onChange(dateStr || null);
      onCommit();
    }
  }

  return (
    <input
      ref={inputRef}
      type="date"
      value={dateStr}
      onChange={(e) => setDateStr(e.target.value)}
      onBlur={() => {
        onChange(dateStr || null);
        onCommit();
      }}
      onKeyDown={handleKeyDown}
      aria-label={t("tables.cells.date.aria_label")}
      className="w-full h-full text-sm border-0 bg-transparent outline-none focus:ring-1 focus:ring-primary rounded px-1.5"
    />
  );
}
