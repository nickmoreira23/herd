"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Rss } from "lucide-react";
import { toast } from "sonner";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef, StatCard } from "@/components/shared/block-list-page";
import { getFeedColumns } from "./feed-columns";
import { AddFeedModal } from "./add-feed-modal";
import { FeedDeleteDialog } from "./feed-delete-dialog";
import { FeedEntriesDialog } from "./feed-entries-dialog";
import { FeedSettingsDialog } from "./feed-settings-dialog";
import type { RSSFeedRow, RSSFeedStats } from "./types";

interface FeedsListClientProps {
  initialFeeds: RSSFeedRow[];
  initialStats: RSSFeedStats;
}

export function FeedsListClient({
  initialFeeds,
  initialStats,
}: FeedsListClientProps) {
  const [feeds, setFeeds] = useState<RSSFeedRow[]>(initialFeeds);
  const [stats, setStats] = useState<RSSFeedStats>(initialStats);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RSSFeedRow | null>(null);
  const [entriesTarget, setEntriesTarget] = useState<RSSFeedRow | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<RSSFeedRow | null>(null);

  // ── Data refresh ──────────────────────────────────────────────────
  const refreshFeeds = useCallback(async () => {
    const res = await fetch("/api/feeds");
    const json = await res.json();
    if (json.data) {
      setFeeds(json.data.feeds);
      setStats(json.data.stats);
    }
  }, []);

  // ── Action handlers ───────────────────────────────────────────────
  const handleSync = useCallback(
    async (feed: RSSFeedRow) => {
      toast.info("Syncing feed...");
      const res = await fetch(`/api/feeds/${feed.id}/sync`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        await refreshFeeds();
        toast.success(
          `Sync complete — ${json.data.entriesScraped} new articles`,
        );
      } else {
        await refreshFeeds();
        toast.error("Sync failed");
      }
    },
    [refreshFeeds],
  );

  const handleToggleActive = useCallback(
    async (feed: RSSFeedRow) => {
      const res = await fetch(`/api/feeds/${feed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !feed.isActive }),
      });
      if (res.ok) {
        await refreshFeeds();
        toast.success(feed.isActive ? "Feed deactivated" : "Feed activated");
      }
    },
    [refreshFeeds],
  );

  const handleDelete = useCallback(
    async (feed: RSSFeedRow) => {
      const res = await fetch(`/api/feeds/${feed.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshFeeds();
        toast.success("Feed deleted");
      } else {
        toast.error("Failed to delete feed");
      }
      setDeleteTarget(null);
    },
    [refreshFeeds],
  );

  // ── Columns ───────────────────────────────────────────────────────
  const columns = useMemo(
    () =>
      getFeedColumns({
        onViewEntries: (feed) => setEntriesTarget(feed),
        onSync: handleSync,
        onSettings: (feed) => setSettingsTarget(feed),
        onToggleActive: handleToggleActive,
        onDelete: (feed) => setDeleteTarget(feed),
      }),
    [handleSync, handleToggleActive],
  );

  // ── Filters ───────────────────────────────────────────────────────
  const filters: FilterDef<RSSFeedRow>[] = useMemo(
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
        filterFn: (item: RSSFeedRow, val: string) => item.status === val,
      },
    ],
    [],
  );

  // ── Stats ─────────────────────────────────────────────────────────
  const statCards: StatCard[] = useMemo(
    () => [
      { label: "Total", value: String(stats.total) },
      { label: "Active", value: String(stats.active) },
      { label: "Articles", value: String(stats.totalEntries) },
      { label: "Error", value: String(stats.error) },
    ],
    [stats],
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <BlockListPage<RSSFeedRow>
      blockName="feeds"
      title="Feeds"
      description="Subscribe to RSS feeds to automatically import articles into your knowledge base."
      data={feeds}
      getId={(f) => f.id}
      columns={columns}
      searchPlaceholder="Search by name or URL..."
      searchFn={(item, q) =>
        item.name.toLowerCase().includes(q) ||
        item.feedUrl.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
      }
      filters={filters}
      stats={statCards}
      headerActions={
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-3 w-3" />
          Add Feed
        </Button>
      }
      emptyIcon={Rss}
      emptyTitle="No feeds yet"
      emptyDescription="Add RSS feed URLs to automatically monitor blogs and news sources. New articles matching your criteria will be imported into your knowledge base on a schedule."
      emptyAction={
        <Button variant="outline" onClick={() => setShowAdd(true)}>
          <Rss className="mr-2 h-4 w-4" />
          Add your first feed
        </Button>
      }
      modals={
        <>
          <AddFeedModal
            open={showAdd}
            onOpenChange={setShowAdd}
            onComplete={refreshFeeds}
          />
          <FeedDeleteDialog
            open={!!deleteTarget}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            feedName={deleteTarget?.name ?? ""}
            onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
          />
          <FeedEntriesDialog
            feed={entriesTarget}
            open={!!entriesTarget}
            onOpenChange={(open) => {
              if (!open) setEntriesTarget(null);
            }}
            onSync={handleSync}
          />
          <FeedSettingsDialog
            feed={settingsTarget}
            open={!!settingsTarget}
            onOpenChange={(open) => {
              if (!open) setSettingsTarget(null);
            }}
            onSave={refreshFeeds}
          />
        </>
      }
    />
  );
}
