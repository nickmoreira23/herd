"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ICON_MAP } from "@/components/landing-page/renderer/components/lp-icon";

interface IconPickerPropProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const iconNames = Object.keys(ICON_MAP);

export function IconPickerProp({ label, value, onChange }: IconPickerPropProps) {
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? iconNames.filter((name) => name.includes(filter.toLowerCase()))
    : iconNames;

  const CurrentIcon = ICON_MAP[value];

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        {CurrentIcon && (
          <div className="h-8 w-8 rounded-md border flex items-center justify-center shrink-0 bg-muted">
            <CurrentIcon className="h-4 w-4" />
          </div>
        )}
        <Input
          value={filter || value}
          onChange={(e) => setFilter(e.target.value)}
          onFocus={() => setFilter("")}
          onBlur={() => setFilter("")}
          placeholder="Search icons..."
          className="h-8 text-xs flex-1"
        />
      </div>
      <div className="grid grid-cols-6 gap-1 max-h-[140px] overflow-y-auto p-1 rounded-md border bg-muted/30">
        {filtered.map((name) => {
          const Icon = ICON_MAP[name];
          return (
            <button
              key={name}
              type="button"
              title={name}
              className={cn(
                "h-7 w-7 rounded flex items-center justify-center transition-colors",
                value === name
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              onClick={() => {
                onChange(name);
                setFilter("");
              }}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-6 text-xs text-muted-foreground text-center py-2">
            No icons match
          </p>
        )}
      </div>
    </div>
  );
}
