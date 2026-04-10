"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  Database,
  Brain,
  Sparkles,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";

export interface ThinkingStep {
  id: string;
  text: string;
  phase: "searching" | "retrieving" | "analyzing" | "enriching";
  status: "active" | "complete";
  resultText?: string;
}

const phaseIcons = {
  searching: Search,
  retrieving: Database,
  analyzing: Brain,
  enriching: Sparkles,
};

const phaseColors = {
  searching: "text-blue-500",
  retrieving: "text-violet-500",
  analyzing: "text-amber-500",
  enriching: "text-emerald-500",
};

interface ThinkingStepsProps {
  steps: ThinkingStep[];
  isStreaming: boolean;
}

export function ThinkingSteps({ steps, isStreaming }: ThinkingStepsProps) {
  const [expanded, setExpanded] = useState(false);

  if (steps.length === 0) return null;

  const allComplete = steps.every((s) => s.status === "complete");
  const activeStep = steps.find((s) => s.status === "active");
  const isFinished = allComplete && !isStreaming;

  // Summary text for collapsed state
  const summaryText = activeStep
    ? activeStep.text
    : isFinished
      ? `${steps.length} step${steps.length !== 1 ? "s" : ""} completed`
      : "Processing...";

  const summaryIcon = activeStep ? (
    <Loader2 className={cn("h-3.5 w-3.5 animate-spin", phaseColors[activeStep.phase])} />
  ) : isFinished ? (
    <Check className="h-3.5 w-3.5 text-emerald-500" />
  ) : (
    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
  );

  return (
    <div className="w-full">
      {/* Collapsed summary — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        {summaryIcon}
        <span className="truncate">{summaryText}</span>
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 transition-transform",
            expanded && "rotate-90"
          )}
        />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-1 ml-1 space-y-0.5 border-l-2 border-border pl-3">
          {steps.map((step) => {
            const Icon = phaseIcons[step.phase] || Search;
            const colorClass = phaseColors[step.phase] || "text-muted-foreground";
            const isActive = step.status === "active";

            return (
              <div key={step.id} className="flex items-center gap-2 py-0.5 text-xs">
                {isActive ? (
                  <Loader2 className={cn("h-3 w-3 animate-spin shrink-0", colorClass)} />
                ) : (
                  <Icon className={cn("h-3 w-3 shrink-0", colorClass)} />
                )}
                <span className="flex-1 min-w-0 truncate text-muted-foreground">
                  {step.text}
                </span>
                {step.status === "complete" && step.resultText && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Check className="h-2.5 w-2.5" />
                    {step.resultText}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
