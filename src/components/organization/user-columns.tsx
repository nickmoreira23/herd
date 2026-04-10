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
import type { UserRow } from "./user-table";

interface ColumnActions {
  onEdit: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
  onToggleStatus: (user: UserRow) => void;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "border-green-500/50 bg-green-500/10 text-green-500",
  PENDING: "border-yellow-400/50 bg-yellow-400/10 text-yellow-400",
  SUSPENDED: "border-orange-400/50 bg-orange-400/10 text-orange-400",
  TERMINATED: "border-red-400/50 bg-red-400/10 text-red-400",
};

function toTitleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getUserColumns(actions: ColumnActions): ColumnDef<UserRow, any>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          className="rounded border-muted-foreground/30"
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="rounded border-muted-foreground/30"
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "firstName",
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
          onClick={() => actions.onEdit(row.original)}
        >
          <span className="text-sm font-medium">
            {row.original.firstName} {row.original.lastName}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.email}
          </span>
        </button>
      ),
    },
    {
      accessorKey: "networkType",
      header: () => <span className="text-xs">Network</span>,
      cell: ({ row }) => {
        const nt = row.original.networkType;
        return (
          <Badge
            variant="outline"
            className="text-xs font-normal px-1 py-1"
          >
            {toTitleCase(nt)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "profileType",
      header: () => <span className="text-xs">Profile Type</span>,
      cell: ({ row }) => {
        const pt = row.original.profileType;
        return (
          <Badge
            variant="outline"
            className="text-xs font-normal px-1 py-1"
          >
            {pt.displayName}
          </Badge>
        );
      },
    },
    {
      id: "roles",
      header: () => <span className="text-xs">Roles</span>,
      cell: ({ row }) => {
        const roles = row.original.profileRoles;
        if (!roles.length) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {roles.slice(0, 2).map((pr) => (
              <Badge key={pr.role.id} variant="outline" className="text-xs font-normal px-1 py-1">
                {pr.role.displayName}
              </Badge>
            ))}
            {roles.length > 2 && (
              <span className="text-xs text-muted-foreground">+{roles.length - 2}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <span className="text-xs">Status</span>,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant="outline"
            className={`text-xs font-normal px-1 py-1 ${STATUS_COLORS[status] || ""}`}
          >
            {toTitleCase(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "lastLogin",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Login
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => {
        const date = row.original.lastLogin;
        if (!date) return <span className="text-sm text-muted-foreground">Never</span>;
        return (
          <span className="text-sm text-muted-foreground">
            {new Date(date).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
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
            <DropdownMenuItem onClick={() => actions.onEdit(row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onToggleStatus(row.original)}>
              {row.original.status === "SUSPENDED" ? "Activate" : "Suspend"}
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
