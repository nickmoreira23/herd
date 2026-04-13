"use client";

import { useState, useMemo, useCallback } from "react";
import { DataTable } from "@/components/shared/data-table";
import { getFeedColumns } from "./feed-columns";
import { AddFeedModal } from "./add-feed-modal";
import { FeedDeleteDialog } from "./feed-delete-dialog";
import { FeedEntriesDialog } from "./feed-entries-dialog";
import { FeedSettingsDialog } from "./feed-settings-dialog";
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
import type { RSSFeedRow, RSSFeedStats } from "./types";
import { PageHeader } from "@/components/layout/page-header";

const STATUS_OPTIONS = [
  { value: "All Status", filterKey: "ALL" },
  { value: "Pending", filterKey: "PENDING" },
  { value: "Processing", filterKey: "PROCESSING" },
  { value: "Ready", filterKey: "READY" },
  { value: "Error", filterKey: "ERROR" },
] as const;

interface FeedTableProps {
  initialFeeds: RSSFeedRow[];
  initialStats: RSSFeedStats;
}

export function FeedTable({
  initialFeeds,
  initialStats,
}: FeedTableProps) {
  const [feeds, setFeeds] = useState<RSSFeedRow[]>(initialFeeds);
  const [stats, setStats] = useState<RSSFeedStats>(initialStats);
  const [search, setSearch] = useState("");
  const [statusValue, setStatusValue] = useState("All Status");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RSSFeedRow | null>(null);
  const [entriesTarget, setEntriesTarget] = useState<RSSFeedRow | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<RSSFeedRow | null>(null);

  const statusFilter =
    STATUS_OPTIONS.find((s) => s.value === statusValue)?.filterKey ?? "ALL";

  const filteredFeeds = useMemo(() => {
    let filtered = feeds;
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.feedUrl.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [feeds, statusFilter, search]);

  const refreshFeeds = useCallback(async () => {
    const res = await fetch("/api/feeds");
    const json = await res.json();
    if (json.data) {
      setFeeds(json.data.feeds);
      setStats(json.data.stats);
    }
  }, []);

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
          `Sync complete — ${json.data.entriesScraped} new articles`
        );
      } else {
        await refreshFeeds();
        toast.error("Sync failed");
      }
    },
    [refreshFeeds]
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
    [refreshFeeds]
  );

  const handleDelete = useCallback(
    async (feed: RSSFeedRow) => {
      const res = await fetch(`/api/feeds/${feed.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshFeeds();
        toast.success("Feed deleted");
      } else {
        toast.error("Failed to delete feed");
      }
      setDeleteTarget(null);
    },
    [refreshFeeds]
  );

  const columns = useMemo(
    () =>
      getFeedColumns({
        onViewEntries: (feed) => setEntriesTarget(feed),
        onSync: handleSync,
        onSettings: (feed) => setSettingsTarget(feed),
        onToggleActive: handleToggleActive,
        onDelete: (feed) => setDeleteTarget(feed),
      }),
    [handleSync, handleToggleActive]
  );

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title="Feeds"
          description="Subscribe to RSS feeds to automatically import articles into your knowledge base."
          className="pl-0 pt-0"
          action={
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Add Feed
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
              Active
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.active}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Articles
            </p>
            <p className="text-lg font-bold tabular-nums">
              {stats.totalEntries}
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
            data={filteredFeeds}
            toolbar={() => (
              <div className="flex items-center gap-3">
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

                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or URL..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-20 h-8 text-xs w-full"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                    {filteredFeeds.length} items
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </div>

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
  );
}
