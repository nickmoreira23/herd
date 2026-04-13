"use client";

import { Loader2 } from "lucide-react";

export function StepIndicator({ text }: { text: string | null }) {
  if (!text) return null;

  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground py-1 pl-8">
      <Loader2 className="h-3 w-3 animate-spin" />
      {text}
    </div>
  );
}
