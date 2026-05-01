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
import { ArrowUpDown, MoreHorizontal, ExternalLink, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/i18n/format-date";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import type { TableRow } from "./types";

interface ColumnActions {
  onOpen: (table: TableRow) => void;
  onToggleActive: (table: TableRow) => void;
  onDelete: (table: TableRow) => void;
}

type TranslateFn = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

const STATUS_CONFIG: Record<
  string,
  { labelKey: MessageKey; className: string; spinning?: boolean }
> = {
  PENDING: {
    labelKey: "tables.list.status.pending",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  PROCESSING: {
    labelKey: "tables.list.status.processing",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    spinning: true,
  },
  READY: {
    labelKey: "tables.list.status.ready",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  ERROR: {
    labelKey: "tables.list.status.error",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

interface GetTableColumnsParams extends ColumnActions {
  t: TranslateFn;
  locale: Locale;
}

export function getTableColumns(
  params: GetTableColumnsParams,
): ColumnDef<TableRow>[] {
  const { t, locale, ...actions } = params;
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("tables.list.column.name")}
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
      accessorKey: "fieldCount",
      header: () => (
        <span className="text-xs">{t("tables.list.column.fields")}</span>
      ),
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="text-xs font-medium bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
        >
          {row.original.fieldCount}
        </Badge>
      ),
    },
    {
      accessorKey: "recordCount",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("tables.list.column.records")}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.original.recordCount}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: () => (
        <span className="text-xs">{t("tables.list.column.status")}</span>
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
        return (
          <Badge
            variant="outline"
            className={`text-xs font-medium ${config.className}`}
          >
            {config.spinning && (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            )}
            {t(config.labelKey)}
          </Badge>
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
          {t("tables.list.column.created")}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(new Date(row.original.createdAt), locale)}
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
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              {t("tables.list.row.actions.open")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actions.onToggleActive(row.original)}
            >
              {row.original.isActive
                ? t("tables.list.row.actions.deactivate")
                : t("tables.list.row.actions.activate")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => actions.onDelete(row.original)}
            >
              {t("common.actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
