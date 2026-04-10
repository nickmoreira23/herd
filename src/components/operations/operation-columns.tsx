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
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  sortOrder: number;
  isActive: boolean;
  _itemCount: number;
  _preLaunchCost: number;
}

interface ColumnActions {
  onOpen: (category: CategoryRow) => void;
  onDelete: (category: CategoryRow) => void;
  onToggleActive: (category: CategoryRow) => void;
}

export function getOperationColumns(actions: ColumnActions): ColumnDef<CategoryRow>[] {
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
      accessorKey: "icon",
      header: () => <span className="text-xs">Icon</span>,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.getValue("icon") ?? "---"}
        </span>
      ),
    },
    {
      id: "itemCount",
      header: () => <span className="text-xs">Items</span>,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {row.original._itemCount}
        </span>
      ),
    },
    {
      id: "preLaunchCost",
      header: () => <span className="text-xs">Pre-Launch Cost</span>,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatCurrency(row.original._preLaunchCost)}
        </span>
      ),
    },
    {
      accessorKey: "sortOrder",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sort Order
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {row.getValue("sortOrder")}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: () => <span className="text-xs">Status</span>,
      cell: ({ row }) => (
        <button
          onClick={() => actions.onToggleActive(row.original)}
          className="cursor-pointer"
        >
          <Badge variant={row.original.isActive ? "default" : "secondary"} className="text-sm font-normal">
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        </button>
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
              Open
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
