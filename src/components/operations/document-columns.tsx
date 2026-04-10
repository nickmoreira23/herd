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
import { ArrowUpDown, MoreHorizontal, Eye, Download } from "lucide-react";

export interface DocumentRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  isActive: boolean;
  uploadedAt: string;
}

interface ColumnActions {
  onView: (doc: DocumentRow) => void;
  onDownload: (doc: DocumentRow) => void;
  onToggleActive: (doc: DocumentRow) => void;
  onDelete: (doc: DocumentRow) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CATEGORY_LABELS: Record<string, string> = {
  CONTRACT: "Contract",
  TERMS: "Terms",
  PRESENTATION: "Presentation",
  POLICY: "Policy",
  OTHER: "Other",
};

export function getDocumentColumns(actions: ColumnActions): ColumnDef<DocumentRow>[] {
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
          onClick={() => actions.onView(row.original)}
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
      accessorKey: "category",
      header: () => <span className="text-xs">Category</span>,
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-sm font-normal">
          {CATEGORY_LABELS[row.getValue("category") as string] ?? row.getValue("category")}
        </Badge>
      ),
    },
    {
      accessorKey: "fileName",
      header: () => <span className="text-xs">File</span>,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.getValue("fileName")}
        </span>
      ),
    },
    {
      accessorKey: "fileSize",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Size
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatFileSize(row.getValue("fileSize") as number)}
        </span>
      ),
    },
    {
      accessorKey: "uploadedAt",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Uploaded
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.getValue("uploadedAt") as string).toLocaleDateString()}
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
            <DropdownMenuItem onClick={() => actions.onView(row.original)}>
              <Eye className="mr-2 h-3.5 w-3.5" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onDownload(row.original)}>
              <Download className="mr-2 h-3.5 w-3.5" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onToggleActive(row.original)}>
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
