"use client";

import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SOURCE_LABELS } from "./types";

const SOURCE_COLORS: Record<string, string> = {
  asana: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  trello: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  jira: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  notion: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  linear: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  monday: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  clickup: "bg-violet-500/10 text-violet-500 border-violet-500/20",
};

interface TaskSourceBadgeProps {
  source: string | null;
}

export function TaskSourceBadge({ source }: TaskSourceBadgeProps) {
  if (!source) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] gap-1 bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
      >
        <Pencil className="h-2.5 w-2.5" />
        Manual
      </Badge>
    );
  }

  const label = SOURCE_LABELS[source] || source;
  const colorClass = SOURCE_COLORS[source] || "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";

  return (
    <Badge variant="outline" className={`text-[10px] ${colorClass}`}>
      {label}
    </Badge>
  );
}
