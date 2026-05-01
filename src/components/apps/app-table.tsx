"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { getAppColumns } from "./app-columns";
import { AppConnectModal } from "./app-connect-modal";
import { AppAuthModal } from "./app-auth-modal";
import { AppDeleteDialog } from "./app-delete-dialog";
import { AppSettingsDialog } from "./app-settings-dialog";
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
import type { AppRow, AppStats } from "./types";
import { PageHeader } from "@/components/layout/page-header";

type StatusFilterKey = "ALL" | "PENDING" | "PROCESSING" | "READY" | "ERROR";

interface AppTableProps {
  initialApps: AppRow[];
  initialStats: AppStats;
}

export function AppTable({ initialApps, initialStats }: AppTableProps) {
  const t = useT();
  const locale = useLocale();
  // useRouter retained for future navigation needs; left unused but kept to
  // signal that this is still a client navigation surface.
  useRouter();
  const [apps, setApps] = useState<AppRow[]>(initialApps);
  const [stats, setStats] = useState<AppStats>(initialStats);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("ALL");
  const [showConnect, setShowConnect] = useState(false);
  const [connectingSlug] = useState<string | null>(null);
  const [authTarget, setAuthTarget] = useState<{ slug: string; id: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppRow | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<AppRow | null>(null);
  const searchParams = useSearchParams();

  const refreshApps = useCallback(async () => {
    const res = await fetch("/api/apps");
    const json = await res.json();
    if (json.data) {
      setApps(json.data.apps);
      setStats(json.data.stats);
    }
  }, []);

  // Handle OAuth callback query params (?connected=slug or ?error=message)
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

  const filteredApps = useMemo(() => {
    let filtered = apps;
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.slug.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q)),
      );
    }
    return filtered;
  }, [apps, statusFilter, search]);

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

  const connectedSlugs = useMemo(
    () => apps.filter((a) => a.status === "READY").map((a) => a.slug),
    [apps],
  );

  const statusOptions: ReadonlyArray<{
    key: StatusFilterKey;
    label: string;
  }> = useMemo(
    () => [
      { key: "ALL", label: t("apps.list.filters.all_status") },
      { key: "PENDING", label: t("apps.statuses.PENDING.label") },
      { key: "PROCESSING", label: t("apps.statuses.PROCESSING.label") },
      { key: "READY", label: t("apps.statuses.READY.label") },
      { key: "ERROR", label: t("apps.statuses.ERROR.label") },
    ],
    [t],
  );

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title={t("apps.list.title")}
          description={t("apps.list.description")}
          className="pl-0 pt-0"
          action={
            <Button size="sm" onClick={() => setShowConnect(true)}>
              <Plus className="mr-1 h-3 w-3" />
              {t("apps.list.connect_app")}
            </Button>
          }
        />

        {/* Stats */}
        <div className="flex items-center gap-4 mb-6">
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("apps.list.stats.total")}
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.total}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("apps.list.stats.connected")}
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.connected}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("apps.list.stats.syncing")}
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.syncing}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("apps.list.stats.data_points")}
            </p>
            <p className="text-lg font-bold tabular-nums">
              {stats.totalDataPoints}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1">
          <DataTable
            columns={columns}
            data={filteredApps}
            toolbar={() => (
              <div className="flex items-center gap-3">
                <Select
                  value={statusFilter}
                  onValueChange={(val) =>
                    setStatusFilter(
                      (val as StatusFilterKey) ?? "ALL",
                    )
                  }
                >
                  <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs shrink-0">
                    <SlidersHorizontal className="mr-1.5 h-3 w-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t("apps.list.search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-20 h-8 text-xs w-full"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                    {t("apps.list.items_count", { count: filteredApps.length })}
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </div>

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
  );
}
