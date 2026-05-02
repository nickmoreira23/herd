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
import { ArrowUpDown, MoreHorizontal, ExternalLink } from "lucide-react";
import type { FormRow } from "./types";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import type { Locale } from "@/lib/i18n/locales";
import { formatDate } from "@/lib/i18n/format-date";

interface ColumnActions {
  onOpen: (form: FormRow) => void;
  onDelete: (form: FormRow) => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  locale: Locale;
}

const FORM_STATUS_CONFIG: Record<
  string,
  { labelKey: MessageKey; className: string }
> = {
  DRAFT: {
    labelKey: "forms.statuses.DRAFT.label",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  ACTIVE: {
    labelKey: "forms.statuses.ACTIVE.label",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  CLOSED: {
    labelKey: "forms.statuses.CLOSED.label",
    className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  },
};

const ACCESS_CONFIG: Record<string, { labelKey: MessageKey; className: string }> = {
  PUBLIC: {
    labelKey: "forms.access.PUBLIC.label",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  PRIVATE: {
    labelKey: "forms.access.PRIVATE.label",
    className: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
};

export function getFormColumns(
  actions: ColumnActions
): ColumnDef<FormRow>[] {
  const { t, locale } = actions;
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("forms.list.column.name")}
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
      header: () => <span className="text-xs">{t("forms.list.column.status")}</span>,
      cell: ({ row }) => {
        const status = row.original.formStatus;
        const config = FORM_STATUS_CONFIG[status] || FORM_STATUS_CONFIG.DRAFT;
        return (
          <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
            {t(config.labelKey)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "accessMode",
      header: () => <span className="text-xs">{t("forms.list.column.access")}</span>,
      cell: ({ row }) => {
        const access = row.original.accessMode;
        const config = ACCESS_CONFIG[access] || ACCESS_CONFIG.PUBLIC;
        return (
          <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
            {t(config.labelKey)}
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
          {t("forms.list.column.responses")}
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
          {t("forms.list.column.created")}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(new Date(row.original.createdAt), locale, "short")}
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
              {t("forms.list.column.open_form")}
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
