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
import type { KnowledgeLinkRow } from "./types";

interface ColumnActions {
  onViewContent: (link: KnowledgeLinkRow) => void;
  onOpenUrl: (link: KnowledgeLinkRow) => void;
  onRescrape: (link: KnowledgeLinkRow) => void;
  onToggleActive: (link: KnowledgeLinkRow) => void;
  onDelete: (link: KnowledgeLinkRow) => void;
}

function formatContentLength(chars: number): string {
  if (chars < 1000) return `${chars} chars`;
  if (chars < 1_000_000) return `${(chars / 1000).toFixed(1)}K chars`;
  return `${(chars / 1_000_000).toFixed(1)}M chars`;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; spinning?: boolean }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  PROCESSING: {
    label: "Scraping",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    spinning: true,
  },
  READY: {
    label: "Ready",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  ERROR: {
    label: "Error",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

export function getKnowledgeLinkColumns(
  actions: ColumnActions
): ColumnDef<KnowledgeLinkRow>[] {
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
      header: () => <span className="text-xs">Domain</span>,
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
          Content
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => {
        const link = row.original;
        if (link.scrapeMode === "FULL_SITE") {
          if (link.status === "PROCESSING") {
            return (
              <span className="text-xs text-blue-500 tabular-nums">
                {link.pagesScraped}/{link.pagesDiscovered} pages
              </span>
            );
          }
          return (
            <span className="text-sm tabular-nums text-muted-foreground">
              {link.pagesScraped} pages
            </span>
          );
        }
        return (
          <span className="text-sm tabular-nums text-muted-foreground">
            {link.contentLength > 0
              ? formatContentLength(link.contentLength)
              : "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <span className="text-xs">Status</span>,
      cell: ({ row }) => {
        const link = row.original;
        const status = link.status;
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

        // Custom label for full-site crawling
        if (link.scrapeMode === "FULL_SITE" && status === "PROCESSING") {
          return (
            <Badge
              variant="outline"
              className={`text-xs font-medium ${config.className}`}
            >
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Crawling {link.pagesScraped}/{link.pagesDiscovered}
            </Badge>
          );
        }

        return (
          <Badge
            variant="outline"
            className={`text-xs font-medium ${config.className}`}
          >
            {config.spinning && (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            )}
            {config.label}
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
          Last Scraped
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastScrapedAt
            ? new Date(row.original.lastScrapedAt).toLocaleDateString()
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
              View Content
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onOpenUrl(row.original)}>
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Open URL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onRescrape(row.original)}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              {row.original.scrapeMode === "FULL_SITE"
                ? "Re-crawl"
                : "Re-scrape"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actions.onToggleActive(row.original)}
            >
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
