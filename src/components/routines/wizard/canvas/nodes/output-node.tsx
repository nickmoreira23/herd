"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CheckCircle2 } from "lucide-react";
import type { OutputNodeData } from "../canvas-types";

export const OUTPUT_NODE_WIDTH = 260;
export const OUTPUT_NODE_HEIGHT = 80;

export function OutputNode({ data }: NodeProps) {
  const d = data as OutputNodeData;
  return (
    <div
      style={{ width: OUTPUT_NODE_WIDTH, height: OUTPUT_NODE_HEIGHT }}
      className="rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 flex flex-col justify-center"
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground/40 !w-2 !h-2"
      />
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
          Output
        </span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        Routine ends after {d.totalSteps} step{d.totalSteps === 1 ? "" : "s"}.
      </div>
    </div>
  );
}
