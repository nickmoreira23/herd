"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Plug } from "lucide-react";
import { toast } from "sonner";
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
  const [apps, setApps] = useState<AppRow[]>(initialApps);
  const [stats, setStats] = useState<AppStats>(initialStats);
  const [showConnect, setShowConnect] = useState(false);
  const [connectingSlug, setConnectingSlug] = useState<string | null>(null);
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
      toast.success(`${connected} connected successfully!`);
      refreshApps();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      toast.error(`Connection failed: ${error}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, refreshApps]);

  // ── Action handlers ───────────────────────────────────────────────
  const handleSync = useCallback(
    async (app: AppRow) => {
      toast.info(`Syncing ${app.name}...`);
      const res = await fetch(`/api/apps/${app.id}/sync`, {
        method: "POST",
      });
      if (res.ok) {
        await refreshApps();
        toast.success(`${app.name} synced`);
      } else {
        await refreshApps();
        toast.error(`Failed to sync ${app.name}`);
      }
    },
    [refreshApps],
  );

  const handleDelete = useCallback(
    async (app: AppRow) => {
      const res = await fetch(`/api/apps/${app.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshApps();
        toast.success("App deleted");
      } else {
        toast.error("Failed to delete app");
      }
      setDeleteTarget(null);
    },
    [refreshApps],
  );

  const handleConnect = useCallback(
    (slug: string) => {
      const app = apps.find((a) => a.slug === slug);
      if (!app) {
        toast.error(
          `App "${slug}" not found in database. Run prisma seed first.`,
        );
        return;
      }

      // Close the catalog modal and open the auth modal for this app
      setShowConnect(false);
      setAuthTarget({ slug: app.slug, id: app.id });
    },
    [apps],
  );

  const handleDisconnect = useCallback(
    async (app: AppRow) => {
      const res = await fetch(`/api/apps/${app.id}/connect`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshApps();
        toast.success(`${app.name} disconnected`);
      } else {
        toast.error("Failed to disconnect");
      }
    },
    [refreshApps],
  );

  // ── Columns ───────────────────────────────────────────────────────
  const columns = useMemo(
    () =>
      getAppColumns({
        onSync: handleSync,
        onSettings: (app) => setSettingsTarget(app),
        onDisconnect: handleDisconnect,
        onDelete: (app) => setDeleteTarget(app),
      }),
    [handleSync, handleDisconnect],
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
        label: "All Status",
        options: [
          { value: "PENDING", label: "Not Connected" },
          { value: "PROCESSING", label: "Syncing" },
          { value: "READY", label: "Connected" },
          { value: "ERROR", label: "Error" },
        ],
        filterFn: (item: AppRow, val: string) => item.status === val,
      },
    ],
    [],
  );

  // ── Stats ─────────────────────────────────────────────────────────
  const statCards: StatCard[] = useMemo(
    () => [
      { label: "Total", value: String(stats.total) },
      { label: "Connected", value: String(stats.connected) },
      { label: "Syncing", value: String(stats.syncing) },
      { label: "Data Points", value: String(stats.totalDataPoints) },
    ],
    [stats],
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <BlockListPage<AppRow>
      blockName="apps"
      title="Apps"
      description="Connect fitness apps to sync health data into your knowledge base."
      data={apps}
      getId={(a) => a.id}
      columns={columns}
      searchPlaceholder="Search by name or description..."
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
          Connect App
        </Button>
      }
      emptyIcon={Plug}
      emptyTitle="No apps yet"
      emptyDescription="Connect fitness and health apps to automatically sync your data into the knowledge base."
      emptyAction={
        <Button variant="outline" onClick={() => setShowConnect(true)}>
          <Plug className="mr-2 h-4 w-4" />
          Connect your first app
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
              toast.success("App connected successfully!");
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
