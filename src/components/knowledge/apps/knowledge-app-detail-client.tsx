"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plug,
  RefreshCw,
  Loader2,
  Unplug,
  Activity,
  Moon,
  Heart,
  HeartPulse,
  Dumbbell,
  Gauge,
  User,
  Apple,
  MoreHorizontal,
  Zap,
  ExternalLink,
} from "lucide-react";
import { KnowledgeAppAuthModal } from "./knowledge-app-auth-modal";
import type {
  KnowledgeAppDetail,
  KnowledgeAppSyncLogRow,
  KnowledgeAppDataPointRow,
} from "./types";

// ─── Constants ────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Not Connected", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  PROCESSING: { label: "Syncing", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  READY: { label: "Connected", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  ERROR: { label: "Error", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
};

const DATA_CATEGORY_INFO: Record<string, { label: string; description: string; icon: typeof Moon }> = {
  SLEEP: { label: "Sleep", description: "Sleep duration, stages (deep, REM, light), efficiency, bedtime/wake time, and restfulness metrics.", icon: Moon },
  ACTIVITY: { label: "Activity", description: "Daily steps, calories burned, active minutes, movement distance, and intensity breakdown.", icon: Activity },
  RECOVERY: { label: "Recovery", description: "Recovery score, HRV (heart rate variability), resting heart rate, SpO2, and skin temperature.", icon: Heart },
  HEART_RATE: { label: "Heart Rate", description: "Continuous heart rate readings, resting/average/max HR, and heart rate zones.", icon: HeartPulse },
  WORKOUT: { label: "Workout", description: "Exercise sessions with type, duration, strain/intensity, calories, and HR during activity.", icon: Dumbbell },
  READINESS: { label: "Readiness", description: "Daily readiness score based on sleep quality, recovery, activity balance, and body temperature.", icon: Gauge },
  BODY: { label: "Body", description: "Body measurements including weight, height, BMI, body fat percentage, and max heart rate.", icon: User },
  APP_NUTRITION: { label: "Nutrition", description: "Calorie intake, macronutrients (protein, carbs, fat), fiber, sugar, and hydration.", icon: Apple },
  APP_OTHER: { label: "Other", description: "Additional health metrics and data from connected devices.", icon: MoreHorizontal },
};

const SYNC_FREQUENCY_OPTIONS = [
  { value: "15", label: "Every 15 minutes" },
  { value: "30", label: "Every 30 minutes" },
  { value: "60", label: "Every hour" },
  { value: "360", label: "Every 6 hours" },
  { value: "720", label: "Every 12 hours" },
  { value: "1440", label: "Daily" },
  { value: "10080", label: "Weekly" },
] as const;

const DATA_POINT_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  PROCESSING: { label: "Processing", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  READY: { label: "Ready", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  ERROR: { label: "Error", className: "bg-red-500/10 text-red-500 border-red-500/20" },
};

// ─── Component ────────────────────────────────────────────────────

interface KnowledgeAppDetailClientProps {
  app: KnowledgeAppDetail;
}

export function KnowledgeAppDetailClient({ app: initial }: KnowledgeAppDetailClientProps) {
  const router = useRouter();
  const [app, setApp] = useState(initial);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Data tab state
  const [dataPoints, setDataPoints] = useState<KnowledgeAppDataPointRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataCategoryFilter, setDataCategoryFilter] = useState("ALL");
  const [expandedDataId, setExpandedDataId] = useState<string | null>(null);

  // Settings tab state
  const [syncFrequency, setSyncFrequency] = useState(String(app.syncFrequencyMin));
  const [enabledCategories, setEnabledCategories] = useState<string[]>([...app.dataCategories]);
  const [savingSettings, setSavingSettings] = useState(false);

  // Logs tab state
  const [logs, setLogs] = useState<KnowledgeAppSyncLogRow[]>(app.syncLogs);

  const isConnected = app.status === "READY" || app.status === "ERROR";
  const statusStyle = STATUS_STYLES[app.status] || STATUS_STYLES.PENDING;

  const refresh = useCallback(() => {
    router.refresh();
    fetch(`/api/knowledge/apps/${app.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setApp((prev) => ({ ...prev, ...json.data }));
        }
      })
      .catch(() => {});

    // Refresh logs
    fetch(`/api/knowledge/apps/${app.id}/logs`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.logs) setLogs(json.data.logs);
      })
      .catch(() => {});
  }, [app.id, router]);

  // ── Actions ──

  const handleConnect = () => {
    setShowAuthModal(true);
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch(`/api/knowledge/apps/${app.id}/connect`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Disconnected");
        refresh();
      } else {
        toast.error("Failed to disconnect");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch(`/api/knowledge/apps/${app.id}/test`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.data?.details || "Connection test passed");
      } else {
        toast.error(json.error || "Connection test failed");
      }
      refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/knowledge/apps/${app.id}/sync`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.data?.details || "Sync completed");
      } else {
        toast.error(json.error || "Sync failed");
      }
      refresh();
      fetchDataPoints();
    } catch {
      toast.error("Network error");
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/knowledge/apps/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syncFrequencyMin: parseInt(syncFrequency, 10),
          dataCategories: enabledCategories,
        }),
      });
      if (res.ok) {
        toast.success("Settings saved");
        refresh();
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Data fetching ──

  const fetchDataPoints = useCallback(async () => {
    setDataLoading(true);
    const params = new URLSearchParams();
    if (dataCategoryFilter !== "ALL") params.set("category", dataCategoryFilter);
    params.set("limit", "200");

    try {
      const res = await fetch(`/api/knowledge/apps/${app.id}/data?${params.toString()}`);
      const json = await res.json();
      if (json.data?.dataPoints) {
        setDataPoints(json.data.dataPoints);
      }
    } catch {
      // silent
    } finally {
      setDataLoading(false);
    }
  }, [app.id, dataCategoryFilter]);

  // Fetch data points when switching to data tab or changing filter
  useEffect(() => {
    fetchDataPoints();
  }, [fetchDataPoints]);

  function toggleCategory(cat: string) {
    setEnabledCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function formatRelativeTime(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div>
        <Link
          href="/admin/organization/knowledge/apps"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Apps
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden shrink-0">
              {app.logoUrl ? (
                <img src={app.logoUrl} alt={app.name} className="h-14 w-14 object-cover" />
              ) : (
                <div className="h-14 w-14 flex items-center justify-center bg-violet-500/10 rounded-xl">
                  <Plug className="h-7 w-7 text-violet-500" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{app.name}</h1>
                <Badge className={statusStyle.className}>{statusStyle.label}</Badge>
              </div>
              {app.description && (
                <p className="text-sm text-muted-foreground mt-1">{app.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
                  {testing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 mr-1.5" />}
                  Test
                </Button>
                <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                  {syncing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                  Sync Now
                </Button>
                <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={disconnecting} className="text-destructive hover:text-destructive">
                  {disconnecting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Unplug className="h-3.5 w-3.5 mr-1.5" />}
                  Disconnect
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleConnect}>
                <Plug className="h-3.5 w-3.5 mr-1.5" />
                Connect
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* About */}
            <Card>
              <CardHeader><CardTitle className="text-sm">About</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="outline" className="bg-violet-500/10 text-violet-500 border-violet-500/20">{app.category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auth Type</span>
                  <span>{app.authType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
                {app.websiteUrl && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Website</span>
                    <a href={app.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-violet-500 hover:underline">
                      Visit <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connection Status */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Connection</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={statusStyle.className}>{statusStyle.label}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connected Since</span>
                  <span>{app.connectedAt ? new Date(app.connectedAt).toLocaleDateString() : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span>{app.lastSyncAt ? formatRelativeTime(app.lastSyncAt) : "Never"}</span>
                </div>
                {app.errorMessage && (
                  <div className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-500">
                    {app.errorMessage}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Data Points</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border px-4 py-3 text-center">
                  <p className="text-2xl font-bold tabular-nums">{app.dataPointCount}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="rounded-lg border px-4 py-3 text-center">
                  <p className="text-2xl font-bold tabular-nums text-emerald-500">{app.readyDataPointCount}</p>
                  <p className="text-xs text-muted-foreground">Ready</p>
                </div>
                <div className="rounded-lg border px-4 py-3 text-center">
                  <p className="text-2xl font-bold tabular-nums text-yellow-500">
                    {app.dataPointCount - app.readyDataPointCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="rounded-lg border px-4 py-3 text-center">
                  <p className="text-2xl font-bold tabular-nums">{logs.length}</p>
                  <p className="text-xs text-muted-foreground">Sync Logs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supported Data Categories */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Supported Data Categories</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {app.dataCategories.map((cat) => {
                  const info = DATA_CATEGORY_INFO[cat];
                  if (!info) return null;
                  const Icon = info.icon;
                  return (
                    <div key={cat} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 shrink-0">
                        <Icon className="h-4.5 w-4.5 text-violet-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{info.label}</p>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Data Tab ── */}
        <TabsContent value="data" className="space-y-4 mt-6">
          {/* Filter */}
          <div className="flex items-center gap-3">
            <Select value={dataCategoryFilter} onValueChange={(val) => setDataCategoryFilter(val ?? "ALL")}>
              <SelectTrigger className="w-auto min-w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {app.dataCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {DATA_CATEGORY_INFO[cat]?.label || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchDataPoints} disabled={dataLoading}>
              {dataLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {/* Data points list */}
          <div className="rounded-lg border bg-muted/30 min-h-[200px]">
            {dataLoading && (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!dataLoading && dataPoints.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <p className="text-sm text-muted-foreground">No data points synced yet.</p>
                {isConnected && (
                  <Button variant="outline" size="sm" className="mt-3" onClick={handleSync} disabled={syncing}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Sync Now
                  </Button>
                )}
              </div>
            )}
            {!dataLoading && dataPoints.length > 0 && (
              <div className="divide-y">
                {dataPoints.map((dp) => {
                  const dpStatus = DATA_POINT_STATUS[dp.status] || DATA_POINT_STATUS.PENDING;
                  const isExpanded = expandedDataId === dp.id;
                  return (
                    <div key={dp.id} className="px-4 py-3">
                      <button
                        className="flex items-center gap-3 w-full text-left"
                        onClick={() => setExpandedDataId(isExpanded ? null : dp.id)}
                      >
                        <span className="text-sm font-medium tabular-nums min-w-[90px]">
                          {new Date(dp.date).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-violet-500/5 text-violet-500 border-violet-500/20">
                          {DATA_CATEGORY_INFO[dp.category]?.label || dp.category}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${dpStatus.className}`}>
                          {dpStatus.label}
                        </Badge>
                        <span className="flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {isExpanded ? "Collapse" : "Expand"}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="mt-2 pl-[102px]">
                          {dp.textContent ? (
                            <pre className="text-sm whitespace-pre-wrap break-words font-mono leading-relaxed text-muted-foreground">
                              {dp.textContent}
                            </pre>
                          ) : dp.status === "ERROR" ? (
                            <p className="text-sm text-destructive">{dp.errorMessage || "Processing failed."}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">Not yet processed.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Logs Tab ── */}
        <TabsContent value="logs" className="mt-6">
          <div className="rounded-lg border">
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                No sync logs yet.
              </div>
            ) : (
              <div className="divide-y">
                {logs.map((log) => (
                  <div key={log.id} className="px-4 py-3 flex items-start gap-4 text-sm">
                    <span className="tabular-nums text-muted-foreground min-w-[140px] shrink-0">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${
                        log.action === "connect" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        log.action === "disconnect" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                        log.action === "sync" || log.action === "cron_sync" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                        log.action === "test" ? "bg-violet-500/10 text-violet-500 border-violet-500/20" :
                        "bg-muted text-muted-foreground"
                      }`}
                    >
                      {log.action}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${
                        log.status === "success"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}
                    >
                      {log.status}
                    </Badge>
                    <span className="text-muted-foreground flex-1 line-clamp-2">
                      {log.details || "—"}
                    </span>
                    {log.recordsProcessed > 0 && (
                      <span className="tabular-nums text-muted-foreground shrink-0">
                        {log.recordsProcessed} records
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Settings Tab ── */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Sync Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {/* Sync Frequency */}
              <div className="space-y-1.5">
                <Label className="text-xs">Sync Frequency</Label>
                <Select value={syncFrequency} onValueChange={(val) => setSyncFrequency(val ?? "1440")}>
                  <SelectTrigger className="h-9 text-sm max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SYNC_FREQUENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  How often to automatically sync data from {app.name}.
                </p>
              </div>

              {/* Data Categories */}
              <div className="space-y-2">
                <Label className="text-xs">Enabled Data Categories</Label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Select which types of data to sync from this app.
                </p>
                <div className="space-y-2">
                  {app.dataCategories.map((cat) => {
                    const info = DATA_CATEGORY_INFO[cat];
                    if (!info) return null;
                    return (
                      <div key={cat} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div>
                          <span className="text-sm">{info.label}</span>
                          <p className="text-[11px] text-muted-foreground">{info.description}</p>
                        </div>
                        <Switch
                          checked={enabledCategories.includes(cat)}
                          onCheckedChange={() => toggleCategory(cat)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={savingSettings}>
                {savingSettings ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <KnowledgeAppAuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        appSlug={app.slug}
        appId={app.id}
        onSuccess={() => {
          toast.success(`${app.name} connected!`);
          refresh();
        }}
      />
    </div>
  );
}
