"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, RefreshCw, BarChart3, Hash } from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface MixpanelStats {
  projectId: string;
  topEvents: { name: string; count: number }[];
}

// ─── Component ───────────────────────────────────────────────────

export default function MixpanelOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [stats, setStats] = useState<MixpanelStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch("/api/integrations/mixpanel/stats")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setStats(json.data);
        else setError(json.error || "Failed to load Mixpanel stats");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    fetchStats();
  }, [isConnected, fetchStats]);

  // ─── Not Connected State ──────────────────────────────────────

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Connect Mixpanel to view your analytics data and top events.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Loading State ────────────────────────────────────────────

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-5 w-48" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                  <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────

  if (error && !stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 mb-3">
            <BarChart3 className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm text-red-500 text-center">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            className="mt-3"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ─── Loaded State ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Project ID */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Mixpanel Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border px-4 py-3">
            <p className="text-xs text-muted-foreground">Project ID</p>
            <p className="text-sm font-medium tabular-nums mt-0.5">
              {stats?.projectId ?? "---"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top Events */}
      {stats?.topEvents && stats.topEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topEvents.map((event, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 shrink-0">
                    <Hash className="h-4 w-4 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.name}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-muted-foreground shrink-0">
                    {event.count.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          )}
          Refresh
        </Button>
      </div>
    </div>
  );
}
