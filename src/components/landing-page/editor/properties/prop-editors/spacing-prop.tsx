"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { SpacingBox } from "@/types/landing-page";

interface SpacingPropProps {
  label: string;
  value: SpacingBox;
  onChange: (value: SpacingBox) => void;
}

export function SpacingProp({ label, value, onChange }: SpacingPropProps) {
  const handleChange = (side: keyof SpacingBox, num: number) => {
    onChange({ ...value, [side]: isNaN(num) ? 0 : num });
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="grid grid-cols-4 gap-1">
        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <div key={side} className="text-center">
            <Input
              type="number"
              value={value[side]}
              onChange={(e) => handleChange(side, parseInt(e.target.value))}
              className="h-7 text-xs text-center px-1"
              min={0}
            />
            <span className="text-[9px] text-muted-foreground capitalize">{side[0].toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
