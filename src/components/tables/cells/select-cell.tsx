"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import type { CellRendererProps, CellEditorProps } from "./index";

interface Choice {
  id: string;
  name: string;
  color: string;
}

function getChoices(field: { options: Record<string, unknown> | null }): Choice[] {
  if (!field.options?.choices || !Array.isArray(field.options.choices))
    return [];
  return field.options.choices as Choice[];
}

function ChoiceBadge({ choice }: { choice: Choice }) {
  return (
    <Badge
      variant="outline"
      className="text-[11px] px-1.5 py-0 shrink-0"
    >
      {choice.name}
    </Badge>
  );
}

export function SelectCellRenderer({ value, field }: CellRendererProps) {
  const choices = getChoices(field);
  const isMulti = field.type === "multiSelect";

  if (isMulti) {
    const selectedIds = Array.isArray(value) ? (value as string[]) : [];
    const selected = choices.filter((c) => selectedIds.includes(c.id));
    if (selected.length === 0) {
      return <span className="text-muted-foreground/40 text-sm">—</span>;
    }
    return (
      <div className="flex gap-1 flex-wrap overflow-hidden">
        {selected.map((c) => (
          <ChoiceBadge key={c.id} choice={c} />
        ))}
      </div>
    );
  }

  // Single select
  const selectedChoice = choices.find((c) => c.id === value);
  if (!selectedChoice) {
    return <span className="text-muted-foreground/40 text-sm">—</span>;
  }
  return <ChoiceBadge choice={selectedChoice} />;
}

export function SelectCellEditor({
  value,
  field,
  onChange,
  onCommit,
  onCancel,
}: CellEditorProps) {
  const choices = getChoices(field);
  const isMulti = field.type === "multiSelect";
  const [selected, setSelected] = useState<string[]>(() => {
    if (isMulti) return Array.isArray(value) ? (value as string[]) : [];
    return value ? [String(value)] : [];
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        if (isMulti) {
          onChange(selected);
        }
        onCommit();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected, isMulti, onChange, onCommit]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  function toggleChoice(choiceId: string) {
    if (isMulti) {
      const next = selected.includes(choiceId)
        ? selected.filter((id) => id !== choiceId)
        : [...selected, choiceId];
      setSelected(next);
    } else {
      onChange(choiceId);
      onCommit();
    }
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-20 top-full left-0 mt-0.5 bg-popover border rounded-md shadow-md min-w-[160px] max-h-[200px] overflow-y-auto py-1"
    >
      {choices.map((choice) => {
        const isSelected = selected.includes(choice.id);
        return (
          <button
            key={choice.id}
            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent flex items-center gap-2 ${
              isSelected ? "bg-accent/50" : ""
            }`}
            onClick={() => toggleChoice(choice.id)}
          >
            {isMulti && (
              <span
                className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-input"
                }`}
              >
                {isSelected && (
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <path
                      d="M2 5 L4 7 L8 3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                )}
              </span>
            )}
            <ChoiceBadge choice={choice} />
          </button>
        );
      })}
      {choices.length === 0 && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          No choices configured
        </div>
      )}
    </div>
  );
}
