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
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { DynamicIcon } from "@/components/shared/icon-picker";

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
