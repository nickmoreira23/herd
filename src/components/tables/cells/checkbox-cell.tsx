"use client";

import { useT } from "@/lib/i18n/locale-context";
import type { MessageKey } from "@/lib/i18n/t";
import type { CellRendererProps } from "./index";

const CHECKBOX_STATE_KEYS = {
  checked: "tables.cells.checkbox.checked",
  unchecked: "tables.cells.checkbox.unchecked",
} as const satisfies Record<"checked" | "unchecked", MessageKey>;

export function CheckboxCellRenderer({ value }: CellRendererProps) {
  const t = useT();
  const isChecked = !!value;
  const stateKey = isChecked ? "checked" : "unchecked";
  return (
    <div
      className="flex items-center justify-center h-full"
      aria-label={t(CHECKBOX_STATE_KEYS[stateKey])}
      role="checkbox"
      aria-checked={isChecked}
    >
      <div
        className={`h-4 w-4 rounded border flex items-center justify-center ${
          isChecked
            ? "bg-primary border-primary text-primary-foreground"
            : "border-input"
        }`}
      >
        {isChecked && (
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M2.5 6 L5 8.5 L9.5 3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
