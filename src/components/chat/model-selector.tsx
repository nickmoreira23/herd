"use client";

import { CLAUDE_MODELS } from "@/lib/validators/chat";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const currentModel = CLAUDE_MODELS.find((m) => m.id === value);

  return (
    <Select value={value} onValueChange={(v) => { if (v) onChange(v); }} disabled={disabled}>
      <SelectTrigger size="sm" className="h-7 text-xs gap-1 border-none bg-muted/50 hover:bg-muted">
        <SelectValue>{currentModel?.label || "Select model"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CLAUDE_MODELS.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex flex-col">
              <span>{model.label}</span>
              <span className="text-[10px] text-muted-foreground">{model.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
