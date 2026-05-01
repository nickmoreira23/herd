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
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { notifyError, notifyInfo, notifySuccess } from "@/lib/i18n/notify";
import { pluralize } from "@/lib/i18n/pluralize";
import { toast } from "sonner";
import { FEED_STATUSES, feedStatusLabelKey } from "@/lib/feeds/status-options";
import type { RSSFeedRow, RSSFeedStats } from "./types";
import { PageHeader } from "@/components/layout/page-header";

interface FeedTableProps {
  initialFeeds: RSSFeedRow[];
  initialStats: RSSFeedStats;
}

const ALL_STATUS_VALUE = "ALL";

export function FeedTable({
  initialFeeds,
  initialStats,
}: FeedTableProps) {
  const t = useT();
  const locale = useLocale();
  const [feeds, setFeeds] = useState<RSSFeedRow[]>(initialFeeds);
  const [stats, setStats] = useState<RSSFeedStats>(initialStats);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS_VALUE);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RSSFeedRow | null>(null);
  const [entriesTarget, setEntriesTarget] = useState<RSSFeedRow | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<RSSFeedRow | null>(null);

  const filteredFeeds = useMemo(() => {
    let filtered = feeds;
    if (statusFilter !== ALL_STATUS_VALUE) {
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
      notifyInfo("feeds.feedback.syncing", t);
      const res = await fetch(`/api/feeds/${feed.id}/sync`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        const count = Number(json.data?.entriesScraped ?? 0);
        await refreshFeeds();
        const message = pluralize(count, locale, {
          one: t("feeds.feedback.sync_complete_one"),
          other: t("feeds.feedback.sync_complete_other", { count }),
        });
        toast.success(message);
      } else {
        await refreshFeeds();
        notifyError("error.feeds.sync_failed", t);
      }
    },
    [refreshFeeds, t, locale],
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
        notifySuccess(
          feed.isActive ? "feeds.feedback.deactivated" : "feeds.feedback.activated",
          t,
        );
      }
    },
    [refreshFeeds, t],
  );

  const handleDelete = useCallback(
    async (feed: RSSFeedRow) => {
      const res = await fetch(`/api/feeds/${feed.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshFeeds();
        notifySuccess("feeds.feedback.deleted", t);
      } else {
        notifyError("error.feeds.delete_failed", t);
      }
      setDeleteTarget(null);
    },
    [refreshFeeds, t],
  );

  const columns = useMemo(
    () =>
      getFeedColumns(
        {
          onViewEntries: (feed) => setEntriesTarget(feed),
          onSync: handleSync,
          onSettings: (feed) => setSettingsTarget(feed),
          onToggleActive: handleToggleActive,
          onDelete: (feed) => setDeleteTarget(feed),
        },
        t,
        locale,
      ),
    [handleSync, handleToggleActive, t, locale],
  );

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title={t("feeds.list.title")}
          description={t("feeds.list.description")}
          className="pl-0 pt-0"
          action={
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="mr-1 h-3 w-3" />
              {t("feeds.list.add_feed_button")}
            </Button>
          }
        />

        {/* Stats */}
        <div className="flex items-center gap-4 mb-6">
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("feeds.list.stats.total")}
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.total}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("feeds.list.stats.active")}
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.active}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("feeds.list.stats.articles")}
            </p>
            <p className="text-lg font-bold tabular-nums">
              {stats.totalEntries}
            </p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("feeds.list.stats.error")}
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
                      {t("feeds.list.filter_all_status")}
                    </SelectItem>
                    {FEED_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(feedStatusLabelKey(status))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t("feeds.list.search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-20 h-8 text-xs w-full"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                    {t("feeds.list.items_count", {
                      count: filteredFeeds.length,
                    })}
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
