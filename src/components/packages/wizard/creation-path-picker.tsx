"use client";

import { cn } from "@/lib/utils";
import { MousePointerClick, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CreationPath } from "@/stores/package-wizard-store";

interface CreationPathPickerProps {
  value: CreationPath;
  onChange: (path: CreationPath) => void;
}

export function CreationPathPicker({
  value,
  onChange,
}: CreationPathPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Manual */}
      <button
        type="button"
        onClick={() => onChange("manual")}
        className={cn(
          "relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all duration-200",
          "hover:shadow-sm text-center",
          value === "manual"
            ? "border-[#C5F135] bg-[#C5F135]/5 shadow-sm"
            : "border-border bg-card hover:border-border/80"
        )}
      >
        <div className="h-12 w-12 rounded-xl bg-zinc-100 flex items-center justify-center">
          <MousePointerClick
            className={cn(
              "h-6 w-6 transition-colors",
              value === "manual" ? "text-foreground" : "text-muted-foreground"
            )}
          />
        </div>
        <div>
          <p className="font-semibold text-sm">Manual</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Build it yourself, product by product
          </p>
        </div>
      </button>

      {/* Co-Pilot */}
      <button
        type="button"
        onClick={() => onChange("copilot")}
        className={cn(
          "relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all duration-200",
          "hover:shadow-sm text-center",
          value === "copilot"
            ? "border-[#C5F135] bg-[#C5F135]/5 shadow-sm"
            : "border-border bg-card hover:border-border/80"
        )}
      >
        <Badge className="absolute top-2 right-2 bg-[#C5F135] text-black text-[10px] hover:bg-[#C5F135]">
          Recommended
        </Badge>
        <div className="h-12 w-12 rounded-xl bg-[#C5F135]/10 flex items-center justify-center">
          <Sparkles
            className={cn(
              "h-6 w-6 transition-colors",
              value === "copilot" ? "text-[#C5F135]" : "text-muted-foreground"
            )}
          />
        </div>
        <div>
          <p className="font-semibold text-sm">Co-Pilot</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            AI suggests, you decide what stays
          </p>
        </div>
      </button>

      {/* Autonomous */}
      <button
        type="button"
        onClick={() => onChange("autonomous")}
        className={cn(
          "relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all duration-200",
          "hover:shadow-sm text-center",
          value === "autonomous"
            ? "border-[#C5F135] bg-[#C5F135]/5 shadow-sm"
            : "border-border bg-card hover:border-border/80"
        )}
      >
        <Badge className="absolute top-2 right-2 bg-zinc-800 text-white text-[10px] hover:bg-zinc-800">
          Fastest
        </Badge>
        <div className="h-12 w-12 rounded-xl bg-zinc-900/5 flex items-center justify-center">
          <Wand2
            className={cn(
              "h-6 w-6 transition-colors",
              value === "autonomous" ? "text-foreground" : "text-muted-foreground"
            )}
          />
        </div>
        <div>
          <p className="font-semibold text-sm">Autonomous</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            AI builds the entire package for you
          </p>
        </div>
      </button>
    </div>
  );
}
