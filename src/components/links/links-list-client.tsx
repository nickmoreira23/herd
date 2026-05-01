"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Link2 } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { notifyError, notifyInfo, notifySuccess } from "@/lib/i18n/notify";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef, StatCard } from "@/components/shared/block-list-page";
import { LINK_STATUSES, linkStatusLabelKey } from "@/lib/links/status-options";
import { getLinkColumns } from "./link-columns";
import { AddLinkModal } from "./add-link-modal";
import { LinkDeleteDialog } from "./link-delete-dialog";
import { LinkContentDialog } from "./link-content-dialog";
import type { LinkRow, LinkStats } from "./types";

interface LinksListClientProps {
  initialLinks: LinkRow[];
  initialStats: LinkStats;
}

export function LinksListClient({
  initialLinks,
  initialStats,
}: LinksListClientProps) {
  const t = useT();
  const locale = useLocale();
  const [links, setLinks] = useState<LinkRow[]>(initialLinks);
  const [stats, setStats] = useState<LinkStats>(initialStats);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LinkRow | null>(null);
  const [viewTarget, setViewTarget] = useState<LinkRow | null>(null);

  // ── Data refresh ──────────────────────────────────────────────────
  const refreshLinks = useCallback(async () => {
    const res = await fetch("/api/links");
    const json = await res.json();
    if (json.data) {
      setLinks(json.data.links);
      setStats(json.data.stats);
    }
  }, []);

  // ── Action handlers ───────────────────────────────────────────────
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
      const res = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
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

  // ── Columns ───────────────────────────────────────────────────────
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

  // ── Filters ───────────────────────────────────────────────────────
  const filters: FilterDef<LinkRow>[] = useMemo(
    () => [
      {
        key: "status",
        label: t("links.list.filter_all_status"),
        options: LINK_STATUSES.map((status) => ({
          value: status,
          label: t(linkStatusLabelKey(status)),
        })),
        filterFn: (item: LinkRow, val: string) => item.status === val,
      },
    ],
    [t],
  );

  // ── Stats ─────────────────────────────────────────────────────────
  const statCards: StatCard[] = useMemo(
    () => [
      { label: t("links.list.stats.total"), value: String(stats.total) },
      { label: t("links.list.stats.ready"), value: String(stats.ready) },
      {
        label: t("links.list.stats.processing"),
        value: String(stats.processing),
      },
      { label: t("links.list.stats.error"), value: String(stats.error) },
    ],
    [stats, t],
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <BlockListPage<LinkRow>
      blockName="links"
      title={t("links.list.title")}
      description={t("links.list.description")}
      data={links}
      getId={(l) => l.id}
      columns={columns}
      searchPlaceholder={t("links.list.search_placeholder")}
      searchFn={(item, q) =>
        item.name.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.domain.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
      }
      filters={filters}
      stats={statCards}
      headerActions={
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-3 w-3" />
          {t("links.list.add_link_button")}
        </Button>
      }
      emptyIcon={Link2}
      emptyTitle={t("links.empty.title")}
      emptyDescription={t("links.empty.description")}
      emptyAction={
        <Button variant="outline" onClick={() => setShowAdd(true)}>
          <Link2 className="mr-2 h-4 w-4" />
          {t("links.empty.add_first")}
        </Button>
      }
      modals={
        <>
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
      }
    />
  );
}
