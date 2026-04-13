"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { CellRendererProps, CellEditorProps } from "./index";

export function TextCellRenderer({ value }: CellRendererProps) {
  const text = value != null ? String(value) : "";
  return (
    <span className="text-sm truncate block" title={text}>
      {text || <span className="text-muted-foreground/40">—</span>}
    </span>
  );
}

export function TextCellEditor({
  value,
  field,
  onChange,
  onCommit,
  onCancel,
}: CellEditorProps) {
  const [text, setText] = useState(value != null ? String(value) : "");
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const isMultiline = field.type === "multilineText";

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onCancel();
    } else if (e.key === "Enter" && !e.shiftKey) {
      if (!isMultiline) {
        e.preventDefault();
        onChange(text);
        onCommit();
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      onChange(text);
      onCommit();
    }
  }

  if (isMultiline) {
    return (
      <Textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          onChange(text);
          onCommit();
        }}
        onKeyDown={handleKeyDown}
        className="h-full min-h-[60px] text-sm border-0 rounded-none focus-visible:ring-1 focus-visible:ring-primary resize-none p-1.5"
        rows={3}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        onChange(text);
        onCommit();
      }}
      onKeyDown={handleKeyDown}
      className="w-full h-full text-sm border-0 bg-transparent outline-none focus:ring-1 focus:ring-primary rounded px-1.5"
    />
  );
}
