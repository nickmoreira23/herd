"use client";

import { type ColumnDef } from "@tanstack/react-table";
import type { Agent } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, MessageSquare, Sparkles, Blocks, Users } from "lucide-react";
import Image from "next/image";
import { DynamicIcon } from "@/components/shared/icon-picker";

// ─── Linked-To helpers ────────────────────────────────────────

interface LinkedLocation {
  label: string;
  icon: "chat" | "specialist" | "block" | "tiers";
}

const SCOPE_LABELS: Record<string, string> = {
  products: "Products",
  events: "Events",
  meetings: "Meetings",
  agents: "AI Agents",
  partners: "Partners",
  perks: "Perks",
  community: "Community",
  pages: "Pages",
  documents: "Documents",
  images: "Images",
  videos: "Videos",
  audios: "Audios",
  tables: "Tables",
  forms: "Forms",
  links: "Links",
  feeds: "Feeds",
  apps: "Apps",
  tasks: "Tasks",
  subscriptions: "Subscriptions",
  plans: "Plans & Tiers",
  projections: "Financial Projections",
  knowledge: "Knowledge Base",
};

function getLinkedLocations(agent: AgentWithCount): LinkedLocation[] {
  const locations: LinkedLocation[] = [];

  // Derive role/scope from DB fields or fall back to key pattern
  let role = agent.role as string | undefined;
  let scope = agent.scope as string | undefined | null;

  if (!role) {
    // Infer from key when role isn't in the DB yet
    if (agent.key === "orchestrator") {
      role = "ORCHESTRATOR";
    } else if (agent.key === "plans-architect") {
      role = "SPECIALIST";
      scope = "plans";
    } else if (agent.key === "projections-architect") {
      role = "SPECIALIST";
      scope = "projections";
    } else if (agent.key.startsWith("block-")) {
      role = "BLOCK";
      scope = agent.key.replace("block-", "");
    }
  }

  if (role === "ORCHESTRATOR") {
    locations.push({ label: "Chat Sidebar", icon: "chat" });
  } else if (role === "SPECIALIST") {
    const label = scope ? (SCOPE_LABELS[scope] || scope) : "Specialist";
    locations.push({ label, icon: "specialist" });
  } else if (role === "BLOCK") {
    const label = scope ? (SCOPE_LABELS[scope] || scope) : "Block";
    locations.push({ label, icon: "block" });
  }

  // Member-facing agents linked via tiers
  if (agent._count.tierAccess > 0) {
    locations.push({
      label: `${agent._count.tierAccess} tier${agent._count.tierAccess === 1 ? "" : "s"}`,
      icon: "tiers",
    });
  }

  return locations;
}

const LINKED_ICON_MAP = {
  chat: MessageSquare,
  specialist: Sparkles,
  block: Blocks,
  tiers: Users,
};

const LINKED_COLOR_MAP: Record<string, string> = {
  chat: "border-blue-500/50 bg-blue-500/10 text-blue-500",
  specialist: "border-violet-500/50 bg-violet-500/10 text-violet-500",
  block: "border-emerald-500/50 bg-emerald-500/10 text-emerald-500",
  tiers: "border-amber-500/50 bg-amber-500/10 text-amber-500",
};

type AgentWithCount = Agent & { _count: { tierAccess: number } };

interface ColumnActions {
  onOpen: (agent: AgentWithCount) => void;
  onDelete: (agent: AgentWithCount) => void;
  onToggleStatus: (agent: AgentWithCount) => void;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "border-green-500/50 bg-green-500/10 text-green-500",
  BETA: "border-blue-400/50 bg-blue-400/10 text-blue-400",
  DRAFT: "border-amber-400/50 bg-amber-400/10 text-amber-400",
  DEPRECATED: "border-red-400/50 bg-red-400/10 text-red-400",
};

const CATEGORY_COLORS: Record<string, string> = {
  NUTRITION: "border-emerald-500/50 bg-emerald-500/10 text-emerald-500",
  TRAINING: "border-orange-400/50 bg-orange-400/10 text-orange-400",
  RECOVERY: "border-purple-400/50 bg-purple-400/10 text-purple-400",
  COACHING: "border-cyan-400/50 bg-cyan-400/10 text-cyan-400",
  ANALYTICS: "border-pink-400/50 bg-pink-400/10 text-pink-400",
};

export function getAgentColumns(actions: ColumnActions): ColumnDef<AgentWithCount>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          aria-label="Select all"
          className="accent-primary"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          aria-label="Select row"
          className="accent-primary"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <button
          className="flex items-center gap-3 text-left hover:underline"
          onClick={() => actions.onOpen(row.original)}
        >
          <div className="h-8 w-8 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            {row.original.iconUrl ? (
              <Image
                src={row.original.iconUrl}
                alt=""
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            ) : (
              <DynamicIcon
                name={row.original.icon}
                className="h-4 w-4 text-muted-foreground"
              />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{row.original.name}</span>
            {row.original.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {row.original.description}
              </span>
            )}
          </div>
        </button>
      ),
    },
    {
      accessorKey: "key",
      header: () => <span className="text-xs">Key</span>,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.getValue("key")}
        </span>
      ),
    },
    {
      id: "linkedTo",
      header: () => <span className="text-xs">Linked To</span>,
      cell: ({ row }) => {
        const locations = getLinkedLocations(row.original);
        if (locations.length === 0) {
          return <span className="text-sm text-muted-foreground">--</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {locations.map((loc) => {
              const Icon = LINKED_ICON_MAP[loc.icon];
              return (
                <Badge
                  key={loc.label}
                  variant="outline"
                  className={`text-[11px] font-normal gap-1 ${LINKED_COLOR_MAP[loc.icon] || ""}`}
                >
                  <Icon className="h-3 w-3" />
                  {loc.label}
                </Badge>
              );
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: () => <span className="text-xs">Category</span>,
      cell: ({ row }) => {
        const cat = row.getValue("category") as string;
        return (
          <Badge
            variant="outline"
            className={`text-xs font-normal ${CATEGORY_COLORS[cat] || ""}`}
          >
            {cat}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <span className="text-xs">Status</span>,
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant="outline"
            className={`text-xs font-normal ${STATUS_COLORS[status] || ""}`}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: "model",
      header: () => <span className="text-xs">Model</span>,
      cell: ({ row }) => {
        const { modelProvider, modelId } = row.original;
        if (!modelProvider && !modelId) {
          return <span className="text-sm text-muted-foreground">--</span>;
        }
        return (
          <span className="text-sm text-muted-foreground">
            {[modelProvider, modelId].filter(Boolean).join(" / ")}
          </span>
        );
      },
    },
    {
      accessorKey: "dailyUsageLimit",
      header: () => <span className="text-xs">Daily Limit</span>,
      cell: ({ row }) => {
        const limit = row.original.dailyUsageLimit;
        return (
          <span className="text-sm tabular-nums">
            {limit != null ? limit : <span className="text-muted-foreground">Unlimited</span>}
          </span>
        );
      },
    },
    {
      id: "tierCount",
      header: () => <span className="text-xs">Tiers</span>,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {row.original._count.tierAccess}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => actions.onOpen(row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onToggleStatus(row.original)}>
              {row.original.status === "ACTIVE" ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => actions.onDelete(row.original)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
