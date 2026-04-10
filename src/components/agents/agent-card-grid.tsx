"use client";

import type { Agent } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Bot, ImageOff } from "lucide-react";
import Image from "next/image";
import { DynamicIcon } from "@/components/shared/icon-picker";

type AgentWithCount = Agent & { _count: { tierAccess: number } };

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-500",
  BETA: "bg-blue-400/10 text-blue-400",
  DRAFT: "bg-amber-400/10 text-amber-400",
  DEPRECATED: "bg-red-400/10 text-red-400",
};

const CATEGORY_COLORS: Record<string, string> = {
  NUTRITION: "bg-emerald-500/10 text-emerald-500",
  TRAINING: "bg-orange-400/10 text-orange-400",
  RECOVERY: "bg-purple-400/10 text-purple-400",
  COACHING: "bg-cyan-400/10 text-cyan-400",
  ANALYTICS: "bg-pink-400/10 text-pink-400",
};

interface AgentCardGridProps {
  agents: AgentWithCount[];
  onOpen: (agent: AgentWithCount) => void;
}

export function AgentCardGrid({ agents, onOpen }: AgentCardGridProps) {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Bot className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No agents found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {agents.map((agent) => (
        <button
          key={agent.id}
          type="button"
          onClick={() => onOpen(agent)}
          className="group relative flex flex-col rounded-xl border bg-card text-left transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-hidden"
        >
          {/* Icon */}
          <div className="relative aspect-square w-full bg-muted/50 overflow-hidden flex items-center justify-center">
            {agent.iconUrl ? (
              <Image
                src={agent.iconUrl}
                alt={agent.name}
                width={120}
                height={120}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <DynamicIcon
                name={agent.icon}
                className="h-12 w-12 text-muted-foreground/40"
              />
            )}

            {agent.status === "DRAFT" && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full">
                  Draft
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-1.5 p-3">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[agent.status] || "bg-muted text-muted-foreground"}`}
              >
                {agent.status.charAt(0) + agent.status.slice(1).toLowerCase()}
              </span>
            </div>

            <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {agent.name}
            </h3>

            <p className="text-[11px] text-muted-foreground truncate">
              {agent.category}
            </p>

            {agent.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {agent.description}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
