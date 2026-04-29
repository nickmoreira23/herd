"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Hand, Clock, Bell } from "lucide-react";
import type { TriggerNodeData } from "../canvas-types";

export const TRIGGER_NODE_WIDTH = 260;
export const TRIGGER_NODE_HEIGHT = 90;

const ICONS = { MANUAL: Hand, SCHEDULE: Clock, EVENT: Bell };
const COLORS = {
  MANUAL: "border-slate-300 bg-slate-50 dark:bg-slate-900/40",
  SCHEDULE: "border-blue-300 bg-blue-50 dark:bg-blue-950/40",
  EVENT: "border-amber-300 bg-amber-50 dark:bg-amber-950/40",
};

export function TriggerNode({ data }: NodeProps) {
  const d = data as TriggerNodeData;
  const Icon = ICONS[d.triggerType];
  return (
    <div
      style={{ width: TRIGGER_NODE_WIDTH, height: TRIGGER_NODE_HEIGHT }}
      className={`rounded-lg border-2 px-4 py-3 shadow-sm flex flex-col justify-center ${COLORS[d.triggerType]}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
          {d.triggerType}
        </span>
      </div>
      <div className="text-sm font-medium mt-1 line-clamp-2">{d.summary}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground/40 !w-2 !h-2"
      />
    </div>
  );
}
