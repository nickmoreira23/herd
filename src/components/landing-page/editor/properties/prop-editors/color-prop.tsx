"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ColorPropProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorProp({ label, value, onChange }: ColorPropProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8"
          />
          <div
            className="h-8 w-8 rounded-md border border-border cursor-pointer"
            style={{ backgroundColor: value || "#000000" }}
          />
        </div>
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="h-8 text-xs flex-1"
        />
      </div>
    </div>
  );
}
