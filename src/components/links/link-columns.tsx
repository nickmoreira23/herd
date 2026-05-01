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
import {
  ArrowUpDown,
  MoreHorizontal,
  ExternalLink,
  Eye,
  RefreshCw,
  Loader2,
  Globe,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/t";
import { formatDate } from "@/lib/i18n/format-date";
import { linkStatusLabelKey } from "@/lib/links/status-options";
import type { LinkRow } from "./types";

interface ColumnActions {
  onViewContent: (link: LinkRow) => void;
  onOpenUrl: (link: LinkRow) => void;
  onRescrape: (link: LinkRow) => void;
  onToggleActive: (link: LinkRow) => void;
  onDelete: (link: LinkRow) => void;
}

type TranslateFn = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

function formatContentLength(chars: number, t: TranslateFn): string {
  if (chars < 1000) return t("links.list.content.chars_short", { count: chars });
  if (chars < 1_000_000)
    return t("links.list.content.chars_thousands", {
      count: (chars / 1000).toFixed(1),
    });
  return t("links.list.content.chars_millions", {
    count: (chars / 1_000_000).toFixed(1),
  });
}

const STATUS_STYLES: Record<
  string,
  { className: string; spinning?: boolean }
> = {
  PENDING: { className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  PROCESSING: {
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    spinning: true,
  },
  READY: {
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  ERROR: { className: "bg-red-500/10 text-red-500 border-red-500/20" },
};

export function getLinkColumns(
  actions: ColumnActions,
  t: TranslateFn,
  locale: Locale,
): ColumnDef<LinkRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("links.list.columns.name")}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <button
          className="flex items-center gap-2 text-left hover:underline"
          onClick={() => actions.onViewContent(row.original)}
        >
          {row.original.scrapeMode === "FULL_SITE" && (
            <Globe className="h-3.5 w-3.5 text-orange-500 shrink-0" />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium">{row.original.name}</span>
            <span className="text-xs text-muted-foreground line-clamp-1">
              {row.original.domain}
            </span>
          </div>
        </button>
      ),
    },
    {
      accessorKey: "domain",
      header: () => (
        <span className="text-xs">{t("links.list.columns.domain")}</span>
      ),
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="text-xs font-medium bg-orange-500/10 text-orange-500 border-orange-500/20"
        >
          {row.original.domain}
        </Badge>
      ),
    },
    {
      accessorKey: "contentLength",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("links.list.columns.content")}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => {
        const link = row.original;
        if (link.scrapeMode === "FULL_SITE") {
          if (link.status === "PROCESSING") {
            return (
              <span className="text-xs text-blue-500 tabular-nums">
                {t("links.list.content.pages_progress", {
                  scraped: link.pagesScraped,
                  total: link.pagesDiscovered,
                })}
              </span>
            );
          }
          return (
            <span className="text-sm tabular-nums text-muted-foreground">
              {t("links.list.content.pages_count", {
                scraped: link.pagesScraped,
              })}
            </span>
          );
        }
        return (
          <span className="text-sm tabular-nums text-muted-foreground">
            {link.contentLength > 0
              ? formatContentLength(link.contentLength, t)
              : "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => (
        <span className="text-xs">{t("links.list.columns.status")}</span>
      ),
      cell: ({ row }) => {
        const link = row.original;
        const status = link.status;
        const style = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;

        // Custom label for full-site crawling
        if (link.scrapeMode === "FULL_SITE" && status === "PROCESSING") {
          return (
            <Badge
              variant="outline"
              className={`text-xs font-medium ${style.className}`}
            >
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {t("links.list.status.crawling_progress", {
                scraped: link.pagesScraped,
                total: link.pagesDiscovered,
              })}
            </Badge>
          );
        }

        return (
          <Badge
            variant="outline"
            className={`text-xs font-medium ${style.className}`}
          >
            {style.spinning && (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            )}
            {t(linkStatusLabelKey(status))}
          </Badge>
        );
      },
    },
    {
      accessorKey: "lastScrapedAt",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("links.list.columns.last_scraped")}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastScrapedAt
            ? formatDate(new Date(row.original.lastScrapedAt), locale, "short")
            : "—"}
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
            <DropdownMenuItem
              onClick={() => actions.onViewContent(row.original)}
            >
              <Eye className="mr-2 h-3.5 w-3.5" />
              {t("links.list.row_actions.view_content")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onOpenUrl(row.original)}>
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              {t("links.list.row_actions.open_url")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onRescrape(row.original)}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              {row.original.scrapeMode === "FULL_SITE"
                ? t("links.list.row_actions.recrawl")
                : t("links.list.row_actions.rescrape")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actions.onToggleActive(row.original)}
            >
              {row.original.isActive
                ? t("links.list.row_actions.deactivate")
                : t("links.list.row_actions.activate")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => actions.onDelete(row.original)}
            >
              {t("links.list.row_actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
