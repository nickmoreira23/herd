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
import type { KnowledgeAudioRow, KnowledgeFolderRow } from "../types";

interface ColumnActions {
  onView: (audio: KnowledgeAudioRow) => void;
  onDownload: (audio: KnowledgeAudioRow) => void;
  onToggleActive: (audio: KnowledgeAudioRow) => void;
  onDelete: (audio: KnowledgeAudioRow) => void;
  folders?: KnowledgeFolderRow[];
  onMoveToFolder?: (audio: KnowledgeAudioRow, folderId: string | null) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs >= 1) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const FILE_TYPE_COLORS: Record<string, string> = {
  MP3: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  WAV: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  OGG: "bg-green-500/10 text-green-500 border-green-500/20",
  FLAC: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  AAC: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  M4A: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

const STATUS_CONFIG: Record<string, { label: string; className: string; spinning?: boolean }> = {
  PENDING: { label: "Pending", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  PROCESSING: { label: "Processing", className: "bg-blue-500/10 text-blue-500 border-blue-500/20", spinning: true },
  READY: { label: "Ready", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  ERROR: { label: "Error", className: "bg-red-500/10 text-red-500 border-red-500/20" },
};

export function getKnowledgeAudioColumns(actions: ColumnActions): ColumnDef<KnowledgeAudioRow>[] {
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
          onClick={() => actions.onView(row.original)}
        >
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
      accessorKey: "duration",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Duration
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.original.duration != null ? formatDuration(row.original.duration) : "-"}
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
        const audio = row.original;
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
              <DropdownMenuItem onClick={() => actions.onView(audio)}>
                <Eye className="mr-2 h-3.5 w-3.5" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onDownload(audio)}>
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
                      {audio.folderId && (
                        <DropdownMenuItem
                          onClick={() => actions.onMoveToFolder!(audio, null)}
                        >
                          <FolderOpen className="mr-2 h-3.5 w-3.5" />
                          Root (no folder)
                        </DropdownMenuItem>
                      )}
                      {rootFolders
                        .filter((f) => f.id !== audio.folderId)
                        .map((f) => (
                          <DropdownMenuItem
                            key={f.id}
                            onClick={() => actions.onMoveToFolder!(audio, f.id)}
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
              <DropdownMenuItem onClick={() => actions.onToggleActive(audio)}>
                {audio.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => actions.onDelete(audio)}
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
