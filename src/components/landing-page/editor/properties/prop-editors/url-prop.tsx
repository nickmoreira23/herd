"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UrlPropProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function UrlProp({ label, value, onChange, placeholder }: UrlPropProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "https://..."}
        className="h-8 text-xs"
      />
    </div>
  );
}
