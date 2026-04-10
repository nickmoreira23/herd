"use client";

import { useState, useMemo, useCallback } from "react";
import { DataTable } from "@/components/shared/data-table";
import { getKnowledgeLinkColumns } from "./knowledge-link-columns";
import { KnowledgeAddLinkModal } from "./knowledge-add-link-modal";
import { KnowledgeLinkDeleteDialog } from "./knowledge-link-delete-dialog";
import { KnowledgeLinkContentDialog } from "./knowledge-link-content-dialog";
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
import { toast } from "sonner";
import type { KnowledgeLinkRow, KnowledgeLinkStats } from "./types";
import { PageHeader } from "@/components/layout/page-header";

const STATUS_OPTIONS = [
  { value: "All Status", filterKey: "ALL" },
  { value: "Pending", filterKey: "PENDING" },
  { value: "Processing", filterKey: "PROCESSING" },
  { value: "Ready", filterKey: "READY" },
  { value: "Error", filterKey: "ERROR" },
] as const;

interface KnowledgeLinkTableProps {
  initialLinks: KnowledgeLinkRow[];
  initialStats: KnowledgeLinkStats;
}

export function KnowledgeLinkTable({
  initialLinks,
  initialStats,
}: KnowledgeLinkTableProps) {
  const [links, setLinks] = useState<KnowledgeLinkRow[]>(initialLinks);
  const [stats, setStats] = useState<KnowledgeLinkStats>(initialStats);
  const [search, setSearch] = useState("");
  const [statusValue, setStatusValue] = useState("All Status");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeLinkRow | null>(null);
  const [viewTarget, setViewTarget] = useState<KnowledgeLinkRow | null>(null);

  const statusFilter =
    STATUS_OPTIONS.find((s) => s.value === statusValue)?.filterKey ?? "ALL";

  const filteredLinks = useMemo(() => {
    let filtered = links;
    if (statusFilter !== "ALL") {
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
    const res = await fetch("/api/knowledge/links");
    const json = await res.json();
    if (json.data) {
      setLinks(json.data.links);
      setStats(json.data.stats);
    }
  }, []);

  const handleOpenUrl = useCallback((link: KnowledgeLinkRow) => {
    window.open(link.url, "_blank");
  }, []);

  const handleRescrape = useCallback(
    async (link: KnowledgeLinkRow) => {
      const isFullSite = link.scrapeMode === "FULL_SITE";
      toast.info(isFullSite ? "Re-crawling..." : "Re-scraping...");
      const endpoint = isFullSite
        ? `/api/knowledge/links/${link.id}/crawl`
        : `/api/knowledge/links/${link.id}/scrape`;
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        await refreshLinks();
        toast.success(isFullSite ? "Re-crawl started" : "Re-scrape complete");
      } else {
        await refreshLinks();
        toast.error(isFullSite ? "Re-crawl failed" : "Re-scrape failed");
      }
      // Update the view target if it's the same link
      if (viewTarget?.id === link.id) {
        const updated = await fetch(`/api/knowledge/links/${link.id}`);
        const json = await updated.json();
        if (json.data) setViewTarget(json.data);
      }
    },
    [refreshLinks, viewTarget]
  );

  const handleToggleActive = useCallback(
    async (link: KnowledgeLinkRow) => {
      const res = await fetch(`/api/knowledge/links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      if (res.ok) {
        await refreshLinks();
        toast.success(link.isActive ? "Deactivated" : "Activated");
      }
    },
    [refreshLinks]
  );

  const handleDelete = useCallback(
    async (link: KnowledgeLinkRow) => {
      const res = await fetch(`/api/knowledge/links/${link.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshLinks();
        toast.success("Link deleted");
      } else {
        toast.error("Failed to delete link");
      }
      setDeleteTarget(null);
    },
    [refreshLinks]
  );

  const columns = useMemo(
    () =>
      getKnowledgeLinkColumns({
        onViewContent: (link) => setViewTarget(link),
        onOpenUrl: handleOpenUrl,
        onRescrape: handleRescrape,
        onToggleActive: handleToggleActive,
        onDelete: (link) => setDeleteTarget(link),
      }),
    [handleOpenUrl, handleRescrape, handleToggleActive]
  );

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title="Links"
          description="Add URLs to scrape and import web content into your knowledge base."
          className="pl-0 pt-0"
          action={
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Add Link
            </Button>
          }
        />

        {/* Stats */}
        <div className="flex items-center gap-4 mb-6">
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Total
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.total}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Ready
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.ready}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Processing
            </p>
            <p className="text-lg font-bold tabular-nums">
              {stats.processing}
            </p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Error
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
                  value={statusValue}
                  onValueChange={(val) =>
                    setStatusValue(val ?? "All Status")
                  }
                >
                  <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs shrink-0">
                    <SlidersHorizontal className="mr-1.5 h-3 w-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, URL, or domain..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-20 h-8 text-xs w-full"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                    {filteredLinks.length} items
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <KnowledgeAddLinkModal
        open={showAdd}
        onOpenChange={setShowAdd}
        onComplete={refreshLinks}
      />

      <KnowledgeLinkDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        linkName={deleteTarget?.name ?? ""}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />

      <KnowledgeLinkContentDialog
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
