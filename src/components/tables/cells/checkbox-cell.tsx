"use client";

import type { CellRendererProps } from "./index";

export function CheckboxCellRenderer({ value }: CellRendererProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div
        className={`h-4 w-4 rounded border flex items-center justify-center ${
          value
            ? "bg-primary border-primary text-primary-foreground"
            : "border-input"
        }`}
      >
        {!!value && (
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
