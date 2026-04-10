"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NumberPropProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export function NumberProp({ label, value, onChange, min, max, step, placeholder }: NumberPropProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => {
          const num = parseFloat(e.target.value);
          if (!isNaN(num)) {
            const clamped = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, num));
            onChange(clamped);
          }
        }}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className="h-8 text-xs"
      />
    </div>
  );
}
