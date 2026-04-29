"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot, AlertTriangle, Plus, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepNodeData } from "../canvas-types";

/**
 * Fixed-size node so Dagre layout matches reality. Internal truncation
 * handles content that doesn't fit.
 */
export const STEP_NODE_WIDTH = 260;
export const STEP_NODE_HEIGHT = 168;

export function StepNode({ data, selected }: NodeProps) {
  const d = data as StepNodeData;
  const { step, isInvalid, runStatus } = d;
  const isSelected = selected || d.isSelected;

  return (
    <div
      style={{ width: STEP_NODE_WIDTH, height: STEP_NODE_HEIGHT }}
      className="relative"
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground/40 !w-2 !h-2"
      />

      <div
        onClick={d.onClick}
        className={cn(
          "h-full rounded-lg border-2 px-4 py-3 shadow-sm cursor-pointer transition-all bg-card flex flex-col",
          isSelected
            ? "border-primary ring-2 ring-primary/30"
            : runStatus === "SUCCESS"
              ? "border-emerald-400"
              : runStatus === "FAILED"
                ? "border-rose-400"
                : isInvalid
                  ? "border-amber-400"
                  : "border-border hover:border-foreground/30"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-7 w-7 rounded bg-muted flex items-center justify-center shrink-0 text-xs font-semibold">
              {step.stepOrder}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">
                {step.name || `Step ${step.stepOrder}`}
              </div>
              {step.agentName ? (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                  <Bot className="h-3 w-3 shrink-0" />
                  <span className="truncate">{step.agentName}</span>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground italic">
                  No agent yet
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {runStatus === "SUCCESS" && (
              <Check className="h-4 w-4 text-emerald-500" />
            )}
            {runStatus === "FAILED" && (
              <X className="h-4 w-4 text-rose-500" />
            )}
            {isInvalid && !runStatus && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                d.onDelete();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="h-5 w-5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 flex items-center justify-center transition-colors"
              aria-label="Delete step"
              title="Delete step"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="mt-auto flex items-center gap-1 flex-wrap">
          <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
            {step.outputFormat}
          </span>
          {step.inputSource === "step" && (
            <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
              from prev
            </span>
          )}
        </div>
      </div>

      {/* Add-step button — sits in the gap between this node and the next */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          d.onAddAfter();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute left-1/2 -translate-x-1/2 -bottom-3.5 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
        title="Add step after"
        aria-label="Add step after"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground/40 !w-2 !h-2"
      />
    </div>
  );
}
