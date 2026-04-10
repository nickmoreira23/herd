"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TextPropProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TextProp({ label, value, onChange, placeholder }: TextPropProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-xs"
      />
    </div>
  );
}
