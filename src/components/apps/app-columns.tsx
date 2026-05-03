"use client";

import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  MoreHorizontal,
  RefreshCw,
  Settings,
  Unplug,
  Trash2,
  Loader2,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/t";
import { formatRelativeTime } from "@/lib/i18n/format-relative-time";
import {
  appCategoryLabelKey,
  appStatusLabelKey,
} from "@/lib/apps/provider-catalog";
import type { AppRow } from "./types";

interface ColumnActions {
  onSync: (app: AppRow) => void;
  onSettings: (app: AppRow) => void;
  onDisconnect: (app: AppRow) => void;
  onDelete: (app: AppRow) => void;
}

type TranslateFn = (key: MessageKey, params?: Record<string, string | number>) => string;

const STATUS_STYLES: Record<string, { className: string; spinning?: boolean }> = {
  PENDING: { className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  PROCESSING: {
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    spinning: true,
  },
  READY: { className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  ERROR: { className: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const CATEGORY_STYLES: Record<string, string> = {
  FITNESS: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  HEALTH: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  NUTRITION: "bg-green-500/10 text-green-500 border-green-500/20",
  OTHER: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export function getAppColumns(
  actions: ColumnActions,
  t: TranslateFn,
  locale: Locale,
): ColumnDef<AppRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("apps.list.columns.app")}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/admin/knowledge/apps/${row.original.id}`}
          className="flex items-center gap-3 text-left hover:underline"
        >
          {row.original.logoUrl ? (
            <img
              src={row.original.logoUrl}
              alt={row.original.name}
              className="h-8 w-8 rounded-lg object-contain"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <span className="text-xs font-bold text-violet-500">
                {row.original.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium">{row.original.name}</span>
            {row.original.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {row.original.description}
              </span>
            )}
          </div>
        </Link>
      ),
    },
    {
      accessorKey: "category",
      header: () => <span className="text-xs">{t("apps.list.columns.category")}</span>,
      cell: ({ row }) => {
        const className =
          CATEGORY_STYLES[row.original.category] ?? CATEGORY_STYLES.OTHER;
        return (
          <Badge variant="outline" className={`text-xs font-medium ${className}`}>
            {t(appCategoryLabelKey(row.original.category))}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <span className="text-xs">{t("apps.list.columns.status")}</span>,
      cell: ({ row }) => {
        const style = STATUS_STYLES[row.original.status] ?? STATUS_STYLES.PENDING;
        return (
          <Badge
            variant="outline"
            className={`text-xs font-medium ${style.className}`}
          >
            {style.spinning && (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            )}
            {t(appStatusLabelKey(row.original.status))}
          </Badge>
        );
      },
    },
    {
      accessorKey: "dataPointCount",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("apps.list.columns.data_points")}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.original.dataPointCount > 0 ? (
            <>
              {row.original.readyDataPointCount}/{row.original.dataPointCount}
            </>
          ) : (
            t("apps.list.dash")
          )}
        </span>
      ),
    },
    {
      accessorKey: "lastSyncAt",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("apps.list.columns.last_sync")}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastSyncAt
            ? formatRelativeTime(new Date(row.original.lastSyncAt), locale)
            : t("apps.list.last_sync_never")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const app = row.original;
        const isConnected = app.status === "READY";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isConnected && (
                <DropdownMenuItem onClick={() => actions.onSync(app)}>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  {t("apps.list.actions.sync_now")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => actions.onSettings(app)}>
                <Settings className="mr-2 h-3.5 w-3.5" />
                {t("apps.list.actions.settings")}
              </DropdownMenuItem>
              {isConnected && (
                <DropdownMenuItem onClick={() => actions.onDisconnect(app)}>
                  <Unplug className="mr-2 h-3.5 w-3.5" />
                  {t("apps.list.actions.disconnect")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => actions.onDelete(app)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {t("apps.list.actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
