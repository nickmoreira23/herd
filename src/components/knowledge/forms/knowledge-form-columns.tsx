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
import { ArrowUpDown, MoreHorizontal, ExternalLink, Link2, Eye } from "lucide-react";
import type { KnowledgeFormRow } from "./types";

interface ColumnActions {
  onOpen: (form: KnowledgeFormRow) => void;
  onCopyLink: (form: KnowledgeFormRow) => void;
  onDelete: (form: KnowledgeFormRow) => void;
}

const FORM_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  CLOSED: {
    label: "Closed",
    className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  },
};

const ACCESS_CONFIG: Record<string, { label: string; className: string }> = {
  PUBLIC: {
    label: "Public",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  PRIVATE: {
    label: "Private",
    className: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
};

export function getKnowledgeFormColumns(
  actions: ColumnActions
): ColumnDef<KnowledgeFormRow>[] {
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
      accessorKey: "formStatus",
      header: () => <span className="text-xs">Status</span>,
      cell: ({ row }) => {
        const status = row.original.formStatus;
        const config = FORM_STATUS_CONFIG[status] || FORM_STATUS_CONFIG.DRAFT;
        return (
          <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "accessMode",
      header: () => <span className="text-xs">Access</span>,
      cell: ({ row }) => {
        const access = row.original.accessMode;
        const config = ACCESS_CONFIG[access] || ACCESS_CONFIG.PUBLIC;
        return (
          <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "responseCount",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Responses
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.original.responseCount}
          {row.original.maxResponses && (
            <span className="text-xs"> / {row.original.maxResponses}</span>
          )}
        </span>
      ),
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
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => actions.onOpen(row.original)}>
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Open Form
            </DropdownMenuItem>
            {row.original.formStatus === "ACTIVE" && (
              <>
                <DropdownMenuItem onClick={() => actions.onCopyLink(row.original)}>
                  <Link2 className="mr-2 h-3.5 w-3.5" />
                  Copy Share Link
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open(`/f/${row.original.slug}`, "_blank")
                  }
                >
                  <Eye className="mr-2 h-3.5 w-3.5" />
                  Preview Form
                </DropdownMenuItem>
              </>
            )}
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
