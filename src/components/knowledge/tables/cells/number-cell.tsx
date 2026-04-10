"use client";

import { useState, useRef, useEffect } from "react";
import type { CellRendererProps, CellEditorProps } from "./index";

function formatNumber(
  value: unknown,
  fieldType: string,
  options: Record<string, unknown> | null
): string {
  if (value == null || value === "") return "";
  const num = Number(value);
  if (isNaN(num)) return String(value);

  const precision = (options?.precision as number) ?? 0;

  switch (fieldType) {
    case "currency": {
      const symbol = (options?.symbol as string) || "$";
      return `${symbol}${num.toFixed(precision)}`;
    }
    case "percent":
      return `${num.toFixed(precision)}%`;
    default:
      return precision > 0 ? num.toFixed(precision) : String(num);
  }
}

export function NumberCellRenderer({ value, field }: CellRendererProps) {
  const formatted = formatNumber(value, field.type, field.options);
  return (
    <span className="text-sm tabular-nums text-right block" title={formatted}>
      {formatted || <span className="text-muted-foreground/40">—</span>}
    </span>
  );
}

export function NumberCellEditor({
  value,
  onChange,
  onCommit,
  onCancel,
}: CellEditorProps) {
  const [text, setText] = useState(
    value != null && value !== "" ? String(value) : ""
  );
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
      const num = text === "" ? null : Number(text);
      onChange(num !== null && !isNaN(num) ? num : null);
      onCommit();
    }
  }

  return (
    <input
      ref={inputRef}
      type="number"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const num = text === "" ? null : Number(text);
        onChange(num !== null && !isNaN(num) ? num : null);
        onCommit();
      }}
      onKeyDown={handleKeyDown}
      className="w-full h-full text-sm text-right border-0 bg-transparent outline-none focus:ring-1 focus:ring-primary rounded px-1.5 tabular-nums"
      step="any"
    />
  );
}
