"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Settings2,
  Loader2,
  Rss,
} from "lucide-react";
import type { KnowledgeRSSFeedRow } from "./types";

interface ColumnActions {
  onViewEntries: (feed: KnowledgeRSSFeedRow) => void;
  onSync: (feed: KnowledgeRSSFeedRow) => void;
  onSettings: (feed: KnowledgeRSSFeedRow) => void;
  onToggleActive: (feed: KnowledgeRSSFeedRow) => void;
  onDelete: (feed: KnowledgeRSSFeedRow) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; spinning?: boolean }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  PROCESSING: {
    label: "Syncing",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    spinning: true,
  },
  READY: {
    label: "Ready",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  ERROR: {
    label: "Error",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

const FREQUENCY_CONFIG: Record<string, { label: string; className: string }> = {
  HOURLY: {
    label: "Hourly",
    className: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  },
  DAILY: {
    label: "Daily",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  WEEKLY: {
    label: "Weekly",
    className: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
};

export function getKnowledgeFeedColumns(
  actions: ColumnActions
): ColumnDef<KnowledgeRSSFeedRow>[] {
  return [
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
          className="flex items-center gap-2 text-left hover:underline"
          onClick={() => actions.onViewEntries(row.original)}
        >
          {row.original.faviconUrl ? (
            <img
              src={row.original.faviconUrl}
              alt=""
              className="h-4 w-4 rounded shrink-0"
            />
          ) : (
            <Rss className="h-3.5 w-3.5 text-orange-500 shrink-0" />
          )}
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
      accessorKey: "frequency",
      header: () => <span className="text-xs">Frequency</span>,
      cell: ({ row }) => {
        const freq = FREQUENCY_CONFIG[row.original.frequency] || FREQUENCY_CONFIG.DAILY;
        return (
          <Badge
            variant="outline"
            className={`text-xs font-medium ${freq.className}`}
          >
            {freq.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "entryCount",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Articles
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.original.entryCount}
        </span>
      ),
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
      accessorKey: "lastCheckedAt",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Checked
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastCheckedAt
            ? new Date(row.original.lastCheckedAt).toLocaleDateString()
            : "Never"}
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
            <DropdownMenuItem
              onClick={() => actions.onViewEntries(row.original)}
            >
              <Eye className="mr-2 h-3.5 w-3.5" />
              View Articles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onSync(row.original)}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Sync Now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onSettings(row.original)}>
              <Settings2 className="mr-2 h-3.5 w-3.5" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actions.onToggleActive(row.original)}
            >
              {row.original.isActive ? "Deactivate" : "Activate"}
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
