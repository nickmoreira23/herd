"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BooleanPropProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function BooleanProp({ label, value, onChange }: BooleanPropProps) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
