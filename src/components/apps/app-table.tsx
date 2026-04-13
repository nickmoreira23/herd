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
import { toast } from "sonner";
import type { AppRow, AppStats } from "./types";
import { PageHeader } from "@/components/layout/page-header";

const STATUS_OPTIONS = [
  { value: "All Status", filterKey: "ALL" },
  { value: "Not Connected", filterKey: "PENDING" },
  { value: "Syncing", filterKey: "PROCESSING" },
  { value: "Connected", filterKey: "READY" },
  { value: "Error", filterKey: "ERROR" },
] as const;

interface AppTableProps {
  initialApps: AppRow[];
  initialStats: AppStats;
}

export function AppTable({
  initialApps,
  initialStats,
}: AppTableProps) {
  const router = useRouter();
  const [apps, setApps] = useState<AppRow[]>(initialApps);
  const [stats, setStats] = useState<AppStats>(initialStats);
  const [search, setSearch] = useState("");
  const [statusValue, setStatusValue] = useState("All Status");
  const [showConnect, setShowConnect] = useState(false);
  const [connectingSlug, setConnectingSlug] = useState<string | null>(null);
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
      toast.success(`${connected} connected successfully!`);
      refreshApps();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      toast.error(`Connection failed: ${error}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, refreshApps]);

  const statusFilter =
    STATUS_OPTIONS.find((s) => s.value === statusValue)?.filterKey ?? "ALL";

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
          (a.description && a.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [apps, statusFilter, search]);

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
    [refreshApps]
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
    [refreshApps]
  );

  const handleConnect = useCallback(
    (slug: string) => {
      const app = apps.find((a) => a.slug === slug);
      if (!app) {
        toast.error(`App "${slug}" not found in database. Run prisma seed first.`);
        return;
      }

      // Close the catalog modal and open the auth modal for this app
      setShowConnect(false);
      setAuthTarget({ slug: app.slug, id: app.id });
    },
    [apps]
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
    [refreshApps]
  );

  const columns = useMemo(
    () =>
      getAppColumns({
        onSync: handleSync,
        onSettings: (app) => setSettingsTarget(app),
        onDisconnect: handleDisconnect,
        onDelete: (app) => setDeleteTarget(app),
      }),
    [handleSync, handleDisconnect]
  );

  const connectedSlugs = useMemo(
    () => apps.filter((a) => a.status === "READY").map((a) => a.slug),
    [apps]
  );

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title="Apps"
          description="Connect fitness apps to sync health data into your knowledge base."
          className="pl-0 pt-0"
          action={
            <Button size="sm" onClick={() => setShowConnect(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Connect App
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
              Connected
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.connected}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Syncing
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.syncing}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Data Points
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
                    placeholder="Search by name or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-20 h-8 text-xs w-full"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                    {filteredApps.length} items
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
  );
}
