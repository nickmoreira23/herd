"use client";

/**
 * Knowledge route surface for LINK listing.
 *
 * Coexists with src/components/links/links-list-client.tsx (Blocks
 * route surface). Both share fetch + columns + handlers + stats logic
 * but use different chrome wrappers:
 * - This file: DataTable + inline chrome (PageHeader, search, filters).
 * - links-list-client.tsx: BlockListPage shell (unified chrome).
 *
 * Architectural decision (1.5.6e): kept separate. Extracting a shared
 * useBlockListing() hook is feasible but deferred — Surface (top-level
 * feature post-Phase 1.5) may redefine how blocks are exposed across
 * routes, potentially making this pattern obsolete. Revisit after
 * Surface is built.
 *
 * See: docs/discovery/KNOWLEDGE_ROUTE_LAYER_AUDIT.md
 */

import { useState, useMemo, useCallback } from "react";
import { DataTable } from "@/components/shared/data-table";
import { getLinkColumns } from "./link-columns";
import { AddLinkModal } from "./add-link-modal";
import { LinkDeleteDialog } from "./link-delete-dialog";
import { LinkContentDialog } from "./link-content-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { notifyError, notifyInfo, notifySuccess } from "@/lib/i18n/notify";
import { LINK_STATUSES, linkStatusLabelKey } from "@/lib/links/status-options";
import type { LinkRow, LinkStats } from "./types";
import { PageHeader } from "@/components/layout/page-header";

interface LinkTableProps {
  initialLinks: LinkRow[];
  initialStats: LinkStats;
}

const ALL_STATUS_VALUE = "ALL";

export function LinkTable({
  initialLinks,
  initialStats,
}: LinkTableProps) {
  const t = useT();
  const locale = useLocale();
  const [links, setLinks] = useState<LinkRow[]>(initialLinks);
  const [stats, setStats] = useState<LinkStats>(initialStats);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS_VALUE);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LinkRow | null>(null);
  const [viewTarget, setViewTarget] = useState<LinkRow | null>(null);

  const filteredLinks = useMemo(() => {
    let filtered = links;
    if (statusFilter !== ALL_STATUS_VALUE) {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          l.domain.toLowerCase().includes(q) ||
          (l.description && l.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [links, statusFilter, search]);

  const refreshLinks = useCallback(async () => {
    const res = await fetch("/api/links");
    const json = await res.json();
    if (json.data) {
      setLinks(json.data.links);
      setStats(json.data.stats);
    }
  }, []);

  const handleOpenUrl = useCallback((link: LinkRow) => {
    window.open(link.url, "_blank");
  }, []);

  const handleRescrape = useCallback(
    async (link: LinkRow) => {
      const isFullSite = link.scrapeMode === "FULL_SITE";
      notifyInfo(
        isFullSite ? "links.feedback.recrawling" : "links.feedback.rescraping",
        t,
      );
      const endpoint = isFullSite
        ? `/api/links/${link.id}/crawl`
        : `/api/links/${link.id}/scrape`;
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        await refreshLinks();
        notifySuccess(
          isFullSite
            ? "links.feedback.recrawl_started"
            : "links.feedback.rescrape_complete",
          t,
        );
      } else {
        await refreshLinks();
        notifyError(
          isFullSite ? "error.links.recrawl_failed" : "error.links.rescrape_failed",
          t,
        );
      }
      // Update the view target if it's the same link
      if (viewTarget?.id === link.id) {
        const updated = await fetch(`/api/links/${link.id}`);
        const json = await updated.json();
        if (json.data) setViewTarget(json.data);
      }
    },
    [refreshLinks, viewTarget, t],
  );

  const handleToggleActive = useCallback(
    async (link: LinkRow) => {
      const res = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      if (res.ok) {
        await refreshLinks();
        notifySuccess(
          link.isActive ? "links.feedback.deactivated" : "links.feedback.activated",
          t,
        );
      }
    },
    [refreshLinks, t],
  );

  const handleDelete = useCallback(
    async (link: LinkRow) => {
      const res = await fetch(`/api/links/${link.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshLinks();
        notifySuccess("links.feedback.deleted", t);
      } else {
        notifyError("error.links.delete_failed", t);
      }
      setDeleteTarget(null);
    },
    [refreshLinks, t],
  );

  const columns = useMemo(
    () =>
      getLinkColumns(
        {
          onViewContent: (link) => setViewTarget(link),
          onOpenUrl: handleOpenUrl,
          onRescrape: handleRescrape,
          onToggleActive: handleToggleActive,
          onDelete: (link) => setDeleteTarget(link),
        },
        t,
        locale,
      ),
    [handleOpenUrl, handleRescrape, handleToggleActive, t, locale],
  );

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title={t("links.list.title")}
          description={t("links.list.description")}
          className="pl-0 pt-0"
          action={
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="mr-1 h-3 w-3" />
              {t("links.list.add_link_button")}
            </Button>
          }
        />

        {/* Stats */}
        <div className="flex items-center gap-4 mb-6">
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("links.list.stats.total")}
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.total}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("links.list.stats.ready")}
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.ready}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("links.list.stats.processing")}
            </p>
            <p className="text-lg font-bold tabular-nums">
              {stats.processing}
            </p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("links.list.stats.error")}
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.error}</p>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1">
          <DataTable
            columns={columns}
            data={filteredLinks}
            toolbar={() => (
              <div className="flex items-center gap-3">
                {/* Status filter */}
                <Select
                  value={statusFilter}
                  onValueChange={(val) =>
                    setStatusFilter(val ?? ALL_STATUS_VALUE)
                  }
                >
                  <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs shrink-0">
                    <SlidersHorizontal className="mr-1.5 h-3 w-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_STATUS_VALUE}>
                      {t("links.list.filter_all_status")}
                    </SelectItem>
                    {LINK_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(linkStatusLabelKey(status))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t("links.list.search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-20 h-8 text-xs w-full"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                    {t("links.list.items_count", {
                      count: filteredLinks.length,
                    })}
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <AddLinkModal
        open={showAdd}
        onOpenChange={setShowAdd}
        onComplete={refreshLinks}
      />

      <LinkDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        linkName={deleteTarget?.name ?? ""}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />

      <LinkContentDialog
        link={viewTarget}
        open={!!viewTarget}
        onOpenChange={(open) => {
          if (!open) setViewTarget(null);
        }}
        onRescrape={handleRescrape}
      />
    </>
  );
}
