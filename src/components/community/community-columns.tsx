"use client";

import { type ColumnDef } from "@tanstack/react-table";
import type { CommunityBenefit } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

type BenefitWithCount = CommunityBenefit & { _count: { tierAssignments: number } };

interface ColumnActions {
  onOpen: (benefit: BenefitWithCount) => void;
  onDelete: (benefit: BenefitWithCount) => void;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "border-green-500/50 bg-green-500/10 text-green-500",
  DRAFT: "border-amber-400/50 bg-amber-400/10 text-amber-400",
  ARCHIVED: "border-red-400/50 bg-red-400/10 text-red-400",
};

const PLATFORM_COLORS: Record<string, string> = {
  discord: "border-indigo-400/50 bg-indigo-400/10 text-indigo-400",
  zoom: "border-blue-400/50 bg-blue-400/10 text-blue-400",
  forum: "border-emerald-400/50 bg-emerald-400/10 text-emerald-400",
  slack: "border-purple-400/50 bg-purple-400/10 text-purple-400",
  "in-person": "border-orange-400/50 bg-orange-400/10 text-orange-400",
  other: "border-gray-400/50 bg-gray-400/10 text-gray-400",
};

export function getCommunityColumns(actions: ColumnActions): ColumnDef<BenefitWithCount>[] {
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
          className="flex flex-col text-left hover:underline"
          onClick={() => actions.onOpen(row.original)}
        >
          <span className="text-sm font-medium">{row.original.name}</span>
          {row.original.description && (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {row.original.description}
            </span>
          )}
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
      accessorKey: "platform",
      header: () => <span className="text-xs">Platform</span>,
      cell: ({ row }) => {
        const platform = row.getValue("platform") as string | null;
        if (!platform) {
          return <span className="text-sm text-muted-foreground">--</span>;
        }
        return (
          <Badge
            variant="outline"
            className={`text-xs font-normal ${PLATFORM_COLORS[platform] || PLATFORM_COLORS.other}`}
          >
            {platform}
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
      id: "tierCount",
      header: () => <span className="text-xs">Tiers</span>,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {row.original._count.tierAssignments}
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
