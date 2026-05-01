"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Plug } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { notifyError, notifyInfo, notifySuccess } from "@/lib/i18n/notify";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef, StatCard } from "@/components/shared/block-list-page";
import { getAppColumns } from "./app-columns";
import { AppConnectModal } from "./app-connect-modal";
import { AppAuthModal } from "./app-auth-modal";
import { AppDeleteDialog } from "./app-delete-dialog";
import { AppSettingsDialog } from "./app-settings-dialog";
import type { AppRow, AppStats } from "./types";

interface AppsListClientProps {
  initialApps: AppRow[];
  initialStats: AppStats;
}

export function AppsListClient({
  initialApps,
  initialStats,
}: AppsListClientProps) {
  const t = useT();
  const locale = useLocale();
  const [apps, setApps] = useState<AppRow[]>(initialApps);
  const [stats, setStats] = useState<AppStats>(initialStats);
  const [showConnect, setShowConnect] = useState(false);
  const [connectingSlug] = useState<string | null>(null);
  const [authTarget, setAuthTarget] = useState<{
    slug: string;
    id: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppRow | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<AppRow | null>(null);
  const searchParams = useSearchParams();

  // ── Data refresh ──────────────────────────────────────────────────
  const refreshApps = useCallback(async () => {
    const res = await fetch("/api/apps");
    const json = await res.json();
    if (json.data) {
      setApps(json.data.apps);
      setStats(json.data.stats);
    }
  }, []);

  // ── OAuth callback handler ────────────────────────────────────────
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) {
      notifySuccess("apps.feedback.connected_query", t, { name: connected });
      refreshApps();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      notifyError("error.apps.connection_failed", t, { message: error });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, refreshApps, t]);

  // ── Action handlers ───────────────────────────────────────────────
  const handleSync = useCallback(
    async (app: AppRow) => {
      notifyInfo("apps.feedback.sync_started", t, { name: app.name });
      const res = await fetch(`/api/apps/${app.id}/sync`, { method: "POST" });
      if (res.ok) {
        await refreshApps();
        notifySuccess("apps.feedback.synced", t, { name: app.name });
      } else {
        await refreshApps();
        notifyError("error.apps.sync_named_failed", t, { name: app.name });
      }
    },
    [refreshApps, t],
  );

  const handleDelete = useCallback(
    async (app: AppRow) => {
      const res = await fetch(`/api/apps/${app.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshApps();
        notifySuccess("apps.feedback.app_deleted", t);
      } else {
        notifyError("error.apps.delete_failed", t);
      }
      setDeleteTarget(null);
    },
    [refreshApps, t],
  );

  const handleConnect = useCallback(
    (slug: string) => {
      const app = apps.find((a) => a.slug === slug);
      if (!app) {
        notifyError("error.apps.app_not_found", t, { slug });
        return;
      }
      setShowConnect(false);
      setAuthTarget({ slug: app.slug, id: app.id });
    },
    [apps, t],
  );

  const handleDisconnect = useCallback(
    async (app: AppRow) => {
      const res = await fetch(`/api/apps/${app.id}/connect`, { method: "DELETE" });
      if (res.ok) {
        await refreshApps();
        notifySuccess("apps.feedback.disconnected_named", t, { name: app.name });
      } else {
        notifyError("error.apps.disconnect_failed", t);
      }
    },
    [refreshApps, t],
  );

  // ── Columns ───────────────────────────────────────────────────────
  const columns = useMemo(
    () =>
      getAppColumns(
        {
          onSync: handleSync,
          onSettings: (app) => setSettingsTarget(app),
          onDisconnect: handleDisconnect,
          onDelete: (app) => setDeleteTarget(app),
        },
        t,
        locale,
      ),
    [handleSync, handleDisconnect, t, locale],
  );

  // ── Derived state ─────────────────────────────────────────────────
  const connectedSlugs = useMemo(
    () => apps.filter((a) => a.status === "READY").map((a) => a.slug),
    [apps],
  );

  // ── Filters ───────────────────────────────────────────────────────
  const filters: FilterDef<AppRow>[] = useMemo(
    () => [
      {
        key: "status",
        label: t("apps.list.filters.all_status"),
        options: [
          { value: "PENDING", label: t("apps.statuses.PENDING.label") },
          { value: "PROCESSING", label: t("apps.statuses.PROCESSING.label") },
          { value: "READY", label: t("apps.statuses.READY.label") },
          { value: "ERROR", label: t("apps.statuses.ERROR.label") },
        ],
        filterFn: (item: AppRow, val: string) => item.status === val,
      },
    ],
    [t],
  );

  // ── Stats ─────────────────────────────────────────────────────────
  const statCards: StatCard[] = useMemo(
    () => [
      { label: t("apps.list.stats.total"), value: String(stats.total) },
      {
        label: t("apps.list.stats.connected"),
        value: String(stats.connected),
      },
      { label: t("apps.list.stats.syncing"), value: String(stats.syncing) },
      {
        label: t("apps.list.stats.data_points"),
        value: String(stats.totalDataPoints),
      },
    ],
    [stats, t],
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <BlockListPage<AppRow>
      blockName="apps"
      title={t("apps.list.title")}
      description={t("apps.list.description")}
      data={apps}
      getId={(a) => a.id}
      columns={columns}
      searchPlaceholder={t("apps.list.search_placeholder")}
      searchFn={(item, q) =>
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
      }
      filters={filters}
      stats={statCards}
      headerActions={
        <Button size="sm" onClick={() => setShowConnect(true)}>
          <Plus className="mr-1 h-3 w-3" />
          {t("apps.list.connect_app")}
        </Button>
      }
      emptyIcon={Plug}
      emptyTitle={t("apps.empty.list_title")}
      emptyDescription={t("apps.empty.list_description")}
      emptyAction={
        <Button variant="outline" onClick={() => setShowConnect(true)}>
          <Plug className="mr-2 h-4 w-4" />
          {t("apps.empty.cta")}
        </Button>
      }
      showAgent={false}
      modals={
        <>
          <AppConnectModal
            open={showConnect}
            onOpenChange={setShowConnect}
            connectedSlugs={connectedSlugs}
            connectingSlug={connectingSlug}
            onConnect={handleConnect}
          />
          <AppAuthModal
            open={!!authTarget}
            onOpenChange={(open) => {
              if (!open) setAuthTarget(null);
            }}
            appSlug={authTarget?.slug ?? null}
            appId={authTarget?.id ?? null}
            onSuccess={async () => {
              await refreshApps();
              notifySuccess("apps.feedback.app_connected_success", t);
            }}
          />
          <AppDeleteDialog
            open={!!deleteTarget}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            appName={deleteTarget?.name ?? ""}
            dataPointCount={deleteTarget?.dataPointCount ?? 0}
            onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
          />
          <AppSettingsDialog
            app={settingsTarget}
            open={!!settingsTarget}
            onOpenChange={(open) => {
              if (!open) setSettingsTarget(null);
            }}
            onSave={refreshApps}
          />
        </>
      }
    />
  );
}
