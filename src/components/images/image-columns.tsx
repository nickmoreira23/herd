"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, Eye, Download, Loader2, FolderInput, FolderOpen } from "lucide-react";
import type { ImageRow, FolderRow } from "@/lib/knowledge-commons/types";

interface ColumnActions {
  onView: (image: ImageRow) => void;
  onDownload: (image: ImageRow) => void;
  onToggleActive: (image: ImageRow) => void;
  onDelete: (image: ImageRow) => void;
  folders?: FolderRow[];
  onMoveToFolder?: (image: ImageRow, folderId: string | null) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FILE_TYPE_COLORS: Record<string, string> = {
  PNG: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  JPG: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  WEBP: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  GIF: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  SVG: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  TIFF: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const STATUS_CONFIG: Record<string, { label: string; className: string; spinning?: boolean }> = {
  PENDING: { label: "Pending", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  PROCESSING: { label: "Processing", className: "bg-blue-500/10 text-blue-500 border-blue-500/20", spinning: true },
  READY: { label: "Ready", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  ERROR: { label: "Error", className: "bg-red-500/10 text-red-500 border-red-500/20" },
};

export function getImageColumns(actions: ColumnActions): ColumnDef<ImageRow>[] {
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
      accessorKey: "fileType",
      header: () => <span className="text-xs">Type</span>,
      cell: ({ row }) => {
        const fileType = row.original.fileType;
        const colors = FILE_TYPE_COLORS[fileType] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
        return (
          <Badge variant="outline" className={`text-xs font-medium ${colors}`}>
            {fileType}
          </Badge>
        );
      },
    },
    {
      id: "dimensions",
      header: () => <span className="text-xs">Dimensions</span>,
      cell: ({ row }) => {
        const { width, height } = row.original;
        return (
          <span className="text-sm tabular-nums text-muted-foreground">
            {width && height ? `${width}x${height}` : "-"}
          </span>
        );
      },
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
      accessorKey: "status",
      header: () => <span className="text-xs">Status</span>,
      cell: ({ row }) => {
        const status = row.original.status;
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
        return (
          <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
            {config.spinning && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {config.label}
          </Badge>
        );
      },
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
      id: "actions",
      cell: ({ row }) => {
        const image = row.original;
        const rootFolders = actions.folders?.filter((f) => f.parentId === null) ?? [];
        const hasMove = actions.onMoveToFolder && rootFolders.length > 0;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(image)}>
                <Eye className="mr-2 h-3.5 w-3.5" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onDownload(image)}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Download
              </DropdownMenuItem>

              {hasMove && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <FolderInput className="mr-2 h-3.5 w-3.5" />
                      Move to folder
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {image.folderId && (
                        <DropdownMenuItem
                          onClick={() => actions.onMoveToFolder!(image, null)}
                        >
                          <FolderOpen className="mr-2 h-3.5 w-3.5" />
                          Root (no folder)
                        </DropdownMenuItem>
                      )}
                      {rootFolders
                        .filter((f) => f.id !== image.folderId)
                        .map((f) => (
                          <DropdownMenuItem
                            key={f.id}
                            onClick={() => actions.onMoveToFolder!(image, f.id)}
                          >
                            <FolderOpen
                              className="mr-2 h-3.5 w-3.5"
                              style={{ color: f.color ?? undefined }}
                            />
                            {f.name}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => actions.onToggleActive(image)}>
                {image.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => actions.onDelete(image)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
