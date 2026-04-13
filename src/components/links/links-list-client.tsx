"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Link2 } from "lucide-react";
import { toast } from "sonner";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef, StatCard } from "@/components/shared/block-list-page";
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
      toast.info(isFullSite ? "Re-crawling..." : "Re-scraping...");
      const endpoint = isFullSite
        ? `/api/links/${link.id}/crawl`
        : `/api/links/${link.id}/scrape`;
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        await refreshLinks();
        toast.success(isFullSite ? "Re-crawl started" : "Re-scrape complete");
      } else {
        await refreshLinks();
        toast.error(isFullSite ? "Re-crawl failed" : "Re-scrape failed");
      }
      if (viewTarget?.id === link.id) {
        const updated = await fetch(`/api/links/${link.id}`);
        const json = await updated.json();
        if (json.data) setViewTarget(json.data);
      }
    },
    [refreshLinks, viewTarget],
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
        toast.success(link.isActive ? "Deactivated" : "Activated");
      }
    },
    [refreshLinks],
  );

  const handleDelete = useCallback(
    async (link: LinkRow) => {
      const res = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshLinks();
        toast.success("Link deleted");
      } else {
        toast.error("Failed to delete link");
      }
      setDeleteTarget(null);
    },
    [refreshLinks],
  );

  // ── Columns ───────────────────────────────────────────────────────
  const columns = useMemo(
    () =>
      getLinkColumns({
        onViewContent: (link) => setViewTarget(link),
        onOpenUrl: handleOpenUrl,
        onRescrape: handleRescrape,
        onToggleActive: handleToggleActive,
        onDelete: (link) => setDeleteTarget(link),
      }),
    [handleOpenUrl, handleRescrape, handleToggleActive],
  );

  // ── Filters ───────────────────────────────────────────────────────
  const filters: FilterDef<LinkRow>[] = useMemo(
    () => [
      {
        key: "status",
        label: "All Status",
        options: [
          { value: "PENDING", label: "Pending" },
          { value: "PROCESSING", label: "Processing" },
          { value: "READY", label: "Ready" },
          { value: "ERROR", label: "Error" },
        ],
        filterFn: (item: LinkRow, val: string) => item.status === val,
      },
    ],
    [],
  );

  // ── Stats ─────────────────────────────────────────────────────────
  const statCards: StatCard[] = useMemo(
    () => [
      { label: "Total", value: String(stats.total) },
      { label: "Ready", value: String(stats.ready) },
      { label: "Processing", value: String(stats.processing) },
      { label: "Error", value: String(stats.error) },
    ],
    [stats],
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <BlockListPage<LinkRow>
      blockName="links"
      title="Links"
      description="Add URLs to scrape and import web content into your knowledge base."
      data={links}
      getId={(l) => l.id}
      columns={columns}
      searchPlaceholder="Search by name, URL, or domain..."
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
          Add Link
        </Button>
      }
      emptyIcon={Link2}
      emptyTitle="No links yet"
      emptyDescription="Add URLs to automatically scrape and import web page content into your knowledge base. Keep your knowledge up to date with external sources."
      emptyAction={
        <Button variant="outline" onClick={() => setShowAdd(true)}>
          <Link2 className="mr-2 h-4 w-4" />
          Add your first link
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
