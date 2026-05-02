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
import { ArrowUpDown, MoreHorizontal, Eye, Trash2, Loader2 } from "lucide-react";
import type { FormResponseRow } from "../types";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import type { Locale } from "@/lib/i18n/locales";
import { formatDate } from "@/lib/i18n/format-date";

interface ColumnActions {
  onView: (response: FormResponseRow) => void;
  onDelete: (response: FormResponseRow) => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  locale: Locale;
}

const STATUS_CONFIG: Record<
  string,
  { labelKey: MessageKey; className: string; spinning?: boolean }
> = {
  PENDING: {
    labelKey: "forms.responses.status.PENDING",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  PROCESSING: {
    labelKey: "forms.responses.status.PROCESSING",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    spinning: true,
  },
  READY: {
    labelKey: "forms.responses.status.READY",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  ERROR: {
    labelKey: "forms.responses.status.ERROR",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

export function getFormResponseColumns(
  actions: ColumnActions
): ColumnDef<FormResponseRow>[] {
  const { t, locale } = actions;
  return [
    {
      accessorKey: "submitterName",
      header: () => <span className="text-xs">{t("forms.responses.column.submitter")}</span>,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {row.original.submitterName || t("forms.responses.anonymous")}
          </span>
          {row.original.submitterEmail && (
            <span className="text-xs text-muted-foreground">
              {row.original.submitterEmail}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: () => <span className="text-xs">{t("forms.responses.column.status")}</span>,
      cell: ({ row }) => {
        const config = STATUS_CONFIG[row.original.status] || STATUS_CONFIG.PENDING;
        return (
          <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
            {config.spinning && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {t(config.labelKey)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "submittedAt",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("forms.responses.column.submitted")}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(new Date(row.original.submittedAt), locale, "dateTime")}
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
            <DropdownMenuItem onClick={() => actions.onView(row.original)}>
              <Eye className="mr-2 h-3.5 w-3.5" />
              {t("forms.responses.column.view_response")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => actions.onDelete(row.original)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              {t("common.actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
