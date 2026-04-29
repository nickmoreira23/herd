"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export type InputType = "string" | "number" | "boolean" | "json";

export interface InputRow {
  key: string;
  type: InputType;
  value: string; // serialized; coerced by the type at save-time
}

interface InputsEditorProps {
  rows: InputRow[];
  onChange: (rows: InputRow[]) => void;
}

export function InputsEditor({ rows, onChange }: InputsEditorProps) {
  function update(i: number, patch: Partial<InputRow>) {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next);
  }
  function remove(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...rows, { key: "", type: "string", value: "" }]);
  }

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <div className="text-xs text-muted-foreground border border-dashed rounded p-4 text-center">
          No default inputs. The routine runs with whatever payload the trigger provides.
        </div>
      )}
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_120px_2fr_auto] gap-2 items-start">
          <Input
            value={row.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder="key"
            className="font-mono text-xs"
          />
          <Select
            value={row.type}
            onValueChange={(v) => update(i, { type: v as InputType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">string</SelectItem>
              <SelectItem value="number">number</SelectItem>
              <SelectItem value="boolean">boolean</SelectItem>
              <SelectItem value="json">json</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder={
              row.type === "boolean"
                ? "true / false"
                : row.type === "json"
                  ? '{"foo":"bar"}'
                  : "value"
            }
            className="font-mono text-xs"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(i)}
            aria-label="Remove row"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={add} className="gap-1">
        <Plus className="h-3.5 w-3.5" />
        Add input
      </Button>
    </div>
  );
}

/** Coerce the rows into a plain JSON object suitable for `defaultInputs`. */
export function rowsToInputs(rows: InputRow[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const row of rows) {
    if (!row.key) continue;
    out[row.key] = coerceValue(row.type, row.value);
  }
  return out;
}

/** Inverse: convert an existing inputs object into editable rows. */
export function inputsToRows(input: unknown): InputRow[] {
  if (!input || typeof input !== "object") return [];
  return Object.entries(input as Record<string, unknown>).map(([key, value]) => {
    if (typeof value === "boolean") return { key, type: "boolean", value: String(value) };
    if (typeof value === "number") return { key, type: "number", value: String(value) };
    if (typeof value === "string") return { key, type: "string", value };
    return { key, type: "json", value: JSON.stringify(value) };
  });
}

function coerceValue(type: InputType, raw: string): unknown {
  if (type === "string") return raw;
  if (type === "number") {
    const n = Number(raw);
    return Number.isNaN(n) ? raw : n;
  }
  if (type === "boolean") return raw.trim().toLowerCase() === "true";
  if (type === "json") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}
