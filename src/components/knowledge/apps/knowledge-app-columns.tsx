"use client";

import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  MoreHorizontal,
  RefreshCw,
  Settings,
  Unplug,
  Trash2,
  Loader2,
} from "lucide-react";
import type { KnowledgeAppRow } from "./types";

interface ColumnActions {
  onSync: (app: KnowledgeAppRow) => void;
  onSettings: (app: KnowledgeAppRow) => void;
  onDisconnect: (app: KnowledgeAppRow) => void;
  onDelete: (app: KnowledgeAppRow) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; spinning?: boolean }
> = {
  PENDING: {
    label: "Not Connected",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  PROCESSING: {
    label: "Syncing",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    spinning: true,
  },
  READY: {
    label: "Connected",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  ERROR: {
    label: "Error",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  FITNESS: {
    label: "Fitness",
    className: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  },
  HEALTH: {
    label: "Health",
    className: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  },
  NUTRITION: {
    label: "Nutrition",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  OTHER: {
    label: "Other",
    className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  },
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function getKnowledgeAppColumns(
  actions: ColumnActions
): ColumnDef<KnowledgeAppRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          App
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/admin/organization/knowledge/apps/${row.original.id}`}
          className="flex items-center gap-3 text-left hover:underline"
        >
          {row.original.logoUrl ? (
            <img
              src={row.original.logoUrl}
              alt={row.original.name}
              className="h-8 w-8 rounded-lg object-contain"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <span className="text-xs font-bold text-violet-500">
                {row.original.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium">{row.original.name}</span>
            {row.original.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {row.original.description}
              </span>
            )}
          </div>
        </Link>
      ),
    },
    {
      accessorKey: "category",
      header: () => <span className="text-xs">Category</span>,
      cell: ({ row }) => {
        const config = CATEGORY_CONFIG[row.original.category] || CATEGORY_CONFIG.OTHER;
        return (
          <Badge
            variant="outline"
            className={`text-xs font-medium ${config.className}`}
          >
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <span className="text-xs">Status</span>,
      cell: ({ row }) => {
        const config = STATUS_CONFIG[row.original.status] || STATUS_CONFIG.PENDING;
        return (
          <Badge
            variant="outline"
            className={`text-xs font-medium ${config.className}`}
          >
            {config.spinning && (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            )}
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "dataPointCount",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data Points
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.original.dataPointCount > 0 ? (
            <>
              {row.original.readyDataPointCount}/{row.original.dataPointCount}
            </>
          ) : (
            "—"
          )}
        </span>
      ),
    },
    {
      accessorKey: "lastSyncAt",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Sync
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastSyncAt
            ? formatRelativeTime(row.original.lastSyncAt)
            : "Never"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const app = row.original;
        const isConnected = app.status === "READY";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isConnected && (
                <DropdownMenuItem onClick={() => actions.onSync(app)}>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Sync Now
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => actions.onSettings(app)}>
                <Settings className="mr-2 h-3.5 w-3.5" />
                Settings
              </DropdownMenuItem>
              {isConnected && (
                <DropdownMenuItem onClick={() => actions.onDisconnect(app)}>
                  <Unplug className="mr-2 h-3.5 w-3.5" />
                  Disconnect
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => actions.onDelete(app)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
