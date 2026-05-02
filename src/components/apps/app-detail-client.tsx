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
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { notifyError, notifySuccess } from "@/lib/i18n/notify";
import { formatDate } from "@/lib/i18n/format-date";
import { formatRelativeTime } from "@/lib/i18n/format-relative-time";
import {
  appCategoryLabelKey,
  appDataPointStatusLabelKey,
  appStatusLabelKey,
  dataCategoryDescriptionKey,
  dataCategoryLabelKey,
  syncFrequencyLabelKey,
  SYNC_FREQUENCY_VALUES,
} from "@/lib/apps/provider-catalog";
import { AppAuthModal } from "./app-auth-modal";
import type {
  AppDetail,
  AppSyncLogRow,
  AppDataPointRow,
} from "./types";

// ─── Constants ────────────────────────────────────────────────────

const STATUS_CLASSNAMES: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  PROCESSING: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  READY: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ERROR: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const DATA_POINT_STATUS_CLASSNAMES: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  READY: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ERROR: "bg-red-500/10 text-red-500 border-red-500/20",
};

const DATA_CATEGORY_ICONS: Record<string, LucideIcon> = {
  SLEEP: Moon,
  ACTIVITY: Activity,
  RECOVERY: Heart,
  HEART_RATE: HeartPulse,
  WORKOUT: Dumbbell,
  READINESS: Gauge,
  BODY: User,
  APP_NUTRITION: Apple,
  APP_OTHER: MoreHorizontal,
};

// ─── Component ────────────────────────────────────────────────────

interface AppDetailClientProps {
  app: AppDetail;
}

export function AppDetailClient({ app: initial }: AppDetailClientProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [app, setApp] = useState(initial);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Data tab state
  const [dataPoints, setDataPoints] = useState<AppDataPointRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataCategoryFilter, setDataCategoryFilter] = useState("ALL");
  const [expandedDataId, setExpandedDataId] = useState<string | null>(null);

  // Settings tab state
  const [syncFrequency, setSyncFrequency] = useState(String(app.syncFrequencyMin));
  const [enabledCategories, setEnabledCategories] = useState<string[]>([
    ...app.dataCategories,
  ]);
  const [savingSettings, setSavingSettings] = useState(false);

  // Logs tab state
  const [logs, setLogs] = useState<AppSyncLogRow[]>(app.syncLogs);

  const isConnected = app.status === "READY" || app.status === "ERROR";
  const statusClass =
    STATUS_CLASSNAMES[app.status] ?? STATUS_CLASSNAMES.PENDING;

  const refresh = useCallback(() => {
    router.refresh();
    fetch(`/api/apps/${app.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setApp((prev) => ({ ...prev, ...json.data }));
        }
      })
      .catch(() => {});

    // Refresh logs
    fetch(`/api/apps/${app.id}/logs`)
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
      const res = await fetch(`/api/apps/${app.id}/connect`, { method: "DELETE" });
      if (res.ok) {
        notifySuccess("apps.feedback.disconnected", t);
        refresh();
      } else {
        notifyError("error.apps.disconnect_failed", t);
      }
    } catch {
      notifyError("error.apps.network", t);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch(`/api/apps/${app.id}/test`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        // Server-supplied details (if any) are surfaced raw for now.
        if (json.data?.details) {
          toast.success(json.data.details);
        } else {
          notifySuccess("apps.feedback.test_passed", t);
        }
      } else {
        if (json.error) {
          toast.error(json.error);
        } else {
          notifyError("error.apps.test_failed", t);
        }
      }
      refresh();
    } catch {
      notifyError("error.apps.network", t);
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/apps/${app.id}/sync`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        if (json.data?.details) {
          toast.success(json.data.details);
        } else {
          notifySuccess("apps.feedback.sync_completed", t);
        }
      } else {
        if (json.error) {
          toast.error(json.error);
        } else {
          notifyError("error.apps.sync_failed", t);
        }
      }
      refresh();
      fetchDataPoints();
    } catch {
      notifyError("error.apps.network", t);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/apps/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syncFrequencyMin: parseInt(syncFrequency, 10),
          dataCategories: enabledCategories,
        }),
      });
      if (res.ok) {
        notifySuccess("apps.feedback.settings_saved", t);
        refresh();
      } else {
        notifyError("error.apps.save_settings_failed", t);
      }
    } catch {
      notifyError("error.apps.network", t);
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
      const res = await fetch(`/api/apps/${app.id}/data?${params.toString()}`);
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
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
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
          {t("apps.detail.back")}
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
                <Badge className={statusClass}>
                  {t(appStatusLabelKey(app.status))}
                </Badge>
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
                  {t("apps.detail.actions.test")}
                </Button>
                <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                  {syncing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                  {t("apps.detail.actions.sync_now")}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={disconnecting} className="text-destructive hover:text-destructive">
                  {disconnecting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Unplug className="h-3.5 w-3.5 mr-1.5" />}
                  {t("apps.detail.actions.disconnect")}
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleConnect}>
                <Plug className="h-3.5 w-3.5 mr-1.5" />
                {t("apps.detail.actions.connect")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t("apps.detail.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="data">{t("apps.detail.tabs.data")}</TabsTrigger>
          <TabsTrigger value="logs">{t("apps.detail.tabs.logs")}</TabsTrigger>
          <TabsTrigger value="settings">{t("apps.detail.tabs.settings")}</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("apps.detail.about.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("apps.detail.about.category")}</span>
                  <Badge variant="outline" className="bg-violet-500/10 text-violet-500 border-violet-500/20">
                    {t(appCategoryLabelKey(app.category))}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("apps.detail.about.auth_type")}</span>
                  <span>{app.authType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("apps.detail.about.created")}</span>
                  <span>{formatDate(new Date(app.createdAt), locale, "short")}</span>
                </div>
                {app.websiteUrl && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("apps.detail.about.website")}</span>
                    <a href={app.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-violet-500 hover:underline">
                      {t("apps.detail.about.visit")} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connection Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("apps.detail.connection.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("apps.detail.connection.status")}</span>
                  <Badge className={statusClass}>
                    {t(appStatusLabelKey(app.status))}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("apps.detail.connection.connected_since")}</span>
                  <span>
                    {app.connectedAt
                      ? formatDate(new Date(app.connectedAt), locale, "short")
                      : t("apps.detail.connection.dash")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("apps.detail.connection.last_sync")}</span>
                  <span>
                    {app.lastSyncAt
                      ? formatRelativeTime(new Date(app.lastSyncAt), locale)
                      : t("apps.detail.connection.never")}
                  </span>
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
            <CardHeader>
              <CardTitle className="text-sm">{t("apps.detail.stats.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border px-4 py-3 text-center">
                  <p className="text-2xl font-bold tabular-nums">{app.dataPointCount}</p>
                  <p className="text-xs text-muted-foreground">{t("apps.detail.stats.total")}</p>
                </div>
                <div className="rounded-lg border px-4 py-3 text-center">
                  <p className="text-2xl font-bold tabular-nums text-emerald-500">{app.readyDataPointCount}</p>
                  <p className="text-xs text-muted-foreground">{t("apps.detail.stats.ready")}</p>
                </div>
                <div className="rounded-lg border px-4 py-3 text-center">
                  <p className="text-2xl font-bold tabular-nums text-yellow-500">
                    {app.dataPointCount - app.readyDataPointCount}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("apps.detail.stats.pending")}</p>
                </div>
                <div className="rounded-lg border px-4 py-3 text-center">
                  <p className="text-2xl font-bold tabular-nums">{logs.length}</p>
                  <p className="text-xs text-muted-foreground">{t("apps.detail.stats.sync_logs")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supported Data Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("apps.detail.categories.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {app.dataCategories.map((cat) => {
                  const Icon = DATA_CATEGORY_ICONS[cat];
                  if (!Icon) return null;
                  return (
                    <div key={cat} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 shrink-0">
                        <Icon className="h-4.5 w-4.5 text-violet-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t(dataCategoryLabelKey(cat))}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(dataCategoryDescriptionKey(cat))}
                        </p>
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
                <SelectItem value="ALL">{t("apps.detail.data.filter_all")}</SelectItem>
                {app.dataCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(dataCategoryLabelKey(cat))}
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
                <p className="text-sm text-muted-foreground">{t("apps.detail.data.empty")}</p>
                {isConnected && (
                  <Button variant="outline" size="sm" className="mt-3" onClick={handleSync} disabled={syncing}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    {t("apps.detail.data.sync_now")}
                  </Button>
                )}
              </div>
            )}
            {!dataLoading && dataPoints.length > 0 && (
              <div className="divide-y">
                {dataPoints.map((dp) => {
                  const dpStatusClass =
                    DATA_POINT_STATUS_CLASSNAMES[dp.status] ??
                    DATA_POINT_STATUS_CLASSNAMES.PENDING;
                  const isExpanded = expandedDataId === dp.id;
                  return (
                    <div key={dp.id} className="px-4 py-3">
                      <button
                        className="flex items-center gap-3 w-full text-left"
                        onClick={() => setExpandedDataId(isExpanded ? null : dp.id)}
                      >
                        <span className="text-sm font-medium tabular-nums min-w-[90px]">
                          {formatDate(new Date(dp.date), locale, "short")}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-violet-500/5 text-violet-500 border-violet-500/20">
                          {t(dataCategoryLabelKey(dp.category))}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${dpStatusClass}`}>
                          {t(appDataPointStatusLabelKey(dp.status))}
                        </Badge>
                        <span className="flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {isExpanded
                            ? t("apps.detail.data.collapse")
                            : t("apps.detail.data.expand")}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="mt-2 pl-[102px]">
                          {dp.textContent ? (
                            <pre className="text-sm whitespace-pre-wrap break-words font-mono leading-relaxed text-muted-foreground">
                              {dp.textContent}
                            </pre>
                          ) : dp.status === "ERROR" ? (
                            <p className="text-sm text-destructive">
                              {dp.errorMessage || t("apps.detail.data.processing_failed")}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              {t("apps.detail.data.not_processed")}
                            </p>
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
                {t("apps.detail.logs.empty")}
              </div>
            ) : (
              <div className="divide-y">
                {logs.map((log) => (
                  <div key={log.id} className="px-4 py-3 flex items-start gap-4 text-sm">
                    <span className="tabular-nums text-muted-foreground min-w-[140px] shrink-0">
                      {formatDate(new Date(log.createdAt), locale, "dateTime")}
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
                      {/* TODO 1.5.7 Capstone: localize sync log action labels (raw enum string for now). */}
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
                      {/* TODO 1.5.7 Capstone: localize sync log status (raw string for now). */}
                      {log.status}
                    </Badge>
                    <span className="text-muted-foreground flex-1 line-clamp-2">
                      {log.details || t("apps.detail.logs.no_details")}
                    </span>
                    {log.recordsProcessed > 0 && (
                      <span className="tabular-nums text-muted-foreground shrink-0">
                        {t("apps.detail.logs.records", { count: log.recordsProcessed })}
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
            <CardHeader>
              <CardTitle className="text-sm">{t("apps.detail.settings.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Sync Frequency */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t("apps.detail.settings.frequency_label")}</Label>
                <Select value={syncFrequency} onValueChange={(val) => setSyncFrequency(val ?? "1440")}>
                  <SelectTrigger className="h-9 text-sm max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SYNC_FREQUENCY_VALUES.map((freq) => (
                      <SelectItem key={freq} value={String(freq)}>
                        {t(syncFrequencyLabelKey(freq))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {t("apps.detail.settings.frequency_help", { name: app.name })}
                </p>
              </div>

              {/* Data Categories */}
              <div className="space-y-2">
                <Label className="text-xs">{t("apps.detail.settings.categories_label")}</Label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  {t("apps.detail.settings.categories_help")}
                </p>
                <div className="space-y-2">
                  {app.dataCategories.map((cat) => {
                    const Icon = DATA_CATEGORY_ICONS[cat];
                    if (!Icon) return null;
                    return (
                      <div key={cat} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div>
                          <span className="text-sm">{t(dataCategoryLabelKey(cat))}</span>
                          <p className="text-[11px] text-muted-foreground">
                            {t(dataCategoryDescriptionKey(cat))}
                          </p>
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
                    {t("apps.detail.settings.saving")}
                  </>
                ) : (
                  t("apps.detail.settings.save")
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AppAuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        appSlug={app.slug}
        appId={app.id}
        onSuccess={() => {
          notifySuccess("apps.feedback.connected", t, { name: app.name });
          refresh();
        }}
      />
    </div>
  );
}
