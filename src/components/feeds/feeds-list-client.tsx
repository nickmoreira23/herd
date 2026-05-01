"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Rss } from "lucide-react";
import { toast } from "sonner";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { notifyError, notifyInfo, notifySuccess } from "@/lib/i18n/notify";
import { pluralize } from "@/lib/i18n/pluralize";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef, StatCard } from "@/components/shared/block-list-page";
import { FEED_STATUSES, feedStatusLabelKey } from "@/lib/feeds/status-options";
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
  const t = useT();
  const locale = useLocale();
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
      const res = await fetch(`/api/feeds/${feed.id}`, { method: "DELETE" });
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

  // ── Columns ───────────────────────────────────────────────────────
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

  // ── Filters ───────────────────────────────────────────────────────
  const filters: FilterDef<RSSFeedRow>[] = useMemo(
    () => [
      {
        key: "status",
        label: t("feeds.list.filter_all_status"),
        options: FEED_STATUSES.map((status) => ({
          value: status,
          label: t(feedStatusLabelKey(status)),
        })),
        filterFn: (item: RSSFeedRow, val: string) => item.status === val,
      },
    ],
    [t],
  );

  // ── Stats ─────────────────────────────────────────────────────────
  const statCards: StatCard[] = useMemo(
    () => [
      { label: t("feeds.list.stats.total"), value: String(stats.total) },
      { label: t("feeds.list.stats.active"), value: String(stats.active) },
      {
        label: t("feeds.list.stats.articles"),
        value: String(stats.totalEntries),
      },
      { label: t("feeds.list.stats.error"), value: String(stats.error) },
    ],
    [stats, t],
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <BlockListPage<RSSFeedRow>
      blockName="feeds"
      title={t("feeds.list.title")}
      description={t("feeds.list.description")}
      data={feeds}
      getId={(f) => f.id}
      columns={columns}
      searchPlaceholder={t("feeds.list.search_placeholder")}
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
          {t("feeds.list.add_feed_button")}
        </Button>
      }
      emptyIcon={Rss}
      emptyTitle={t("feeds.empty.title")}
      emptyDescription={t("feeds.empty.description")}
      emptyAction={
        <Button variant="outline" onClick={() => setShowAdd(true)}>
          <Rss className="mr-2 h-4 w-4" />
          {t("feeds.empty.add_first")}
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
