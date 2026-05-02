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
import type { DocumentRow, FolderRow } from "@/lib/knowledge-commons/types";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/t";
import { formatDate } from "@/lib/i18n/format-date";
import { mediaStatusMeta } from "@/lib/knowledge/media-status";

interface ColumnActions {
  onView: (doc: DocumentRow) => void;
  onDownload: (doc: DocumentRow) => void;
  onToggleActive: (doc: DocumentRow) => void;
  onDelete: (doc: DocumentRow) => void;
  folders?: FolderRow[];
  onMoveToFolder?: (doc: DocumentRow, folderId: string | null) => void;
}

type TFn = (key: MessageKey, params?: Record<string, string | number>) => string;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FILE_TYPE_COLORS: Record<string, string> = {
  PDF: "bg-red-500/10 text-red-500 border-red-500/20",
  DOCX: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  TXT: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  MD: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  CSV: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export function getDocumentColumns(
  actions: ColumnActions,
  t: TFn,
  locale: Locale,
): ColumnDef<DocumentRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("documents.columns.name")}
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
      header: () => <span className="text-xs">{t("documents.columns.type")}</span>,
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
      accessorKey: "fileSize",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("documents.columns.size")}
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
      header: () => <span className="text-xs">{t("documents.columns.status")}</span>,
      cell: ({ row }) => {
        const meta = mediaStatusMeta(row.original.status);
        return (
          <Badge variant="outline" className={`text-xs font-medium ${meta.toneClass}`}>
            {meta.spinning && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {t(meta.labelKey)}
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
          {t("documents.columns.uploaded")}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(new Date(row.getValue("uploadedAt") as string), locale, "short")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const doc = row.original;
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
              <DropdownMenuItem onClick={() => actions.onView(doc)}>
                <Eye className="mr-2 h-3.5 w-3.5" />
                {t("documents.columns.actions.view")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onDownload(doc)}>
                <Download className="mr-2 h-3.5 w-3.5" />
                {t("documents.columns.actions.download")}
              </DropdownMenuItem>

              {hasMove && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <FolderInput className="mr-2 h-3.5 w-3.5" />
                      {t("documents.columns.actions.move_to_folder")}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {doc.folderId && (
                        <DropdownMenuItem
                          onClick={() => actions.onMoveToFolder!(doc, null)}
                        >
                          <FolderOpen className="mr-2 h-3.5 w-3.5" />
                          {t("documents.columns.actions.move_to_root")}
                        </DropdownMenuItem>
                      )}
                      {rootFolders
                        .filter((f) => f.id !== doc.folderId)
                        .map((f) => (
                          <DropdownMenuItem
                            key={f.id}
                            onClick={() => actions.onMoveToFolder!(doc, f.id)}
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
              <DropdownMenuItem onClick={() => actions.onToggleActive(doc)}>
                {doc.isActive
                  ? t("documents.columns.actions.deactivate")
                  : t("documents.columns.actions.activate")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => actions.onDelete(doc)}
              >
                {t("documents.columns.actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
