"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex align-middle ml-1 cursor-help appearance-none border-0 bg-transparent p-0"
        onClick={(e) => e.preventDefault()}
      >
        <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px]">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
