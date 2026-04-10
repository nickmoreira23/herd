"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface InlineEditCellProps {
  value: number;
  onSave: (value: number) => void;
  formatter: (value: number) => string;
}

export function InlineEditCell({ value, onSave, formatter }: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function handleSave() {
    setEditing(false);
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed !== value) {
      onSave(Math.round(parsed * 100) / 100);
    }
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        step="0.01"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") setEditing(false);
        }}
        className="h-7 w-24 text-left text-sm"
      />
    );
  }

  return (
    <button
      onClick={() => {
        setEditValue(String(value));
        setEditing(true);
      }}
      className="cursor-pointer rounded px-1 hover:bg-muted text-left w-24 block text-sm"
    >
      {formatter(value)}
    </button>
  );
}
