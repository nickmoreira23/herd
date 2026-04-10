"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, RefreshCw, Users, Heart, Video, Play } from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface TikTokStats {
  displayName: string;
  followers: number;
  likes: number;
  videoCount: number;
}

// ─── Component ───────────────────────────────────────────────────

export default function TikTokOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [stats, setStats] = useState<TikTokStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch("/api/integrations/tiktok/stats")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setStats(json.data);
        else setError(json.error || "Failed to load TikTok stats");
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
            <Play className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Connect TikTok to view your profile stats and videos.
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
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg border px-4 py-3 text-center">
                  <Skeleton className="h-7 w-10 mx-auto mb-1" />
                  <Skeleton className="h-3 w-14 mx-auto" />
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
            <Play className="h-6 w-6 text-red-500" />
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
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">TikTok Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.displayName && (
            <p className="text-sm font-medium mb-4">{stats.displayName}</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border px-4 py-3 text-center">
              <div className="flex justify-center mb-1">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold tabular-nums">
                {stats?.followers?.toLocaleString() ?? "---"}
              </p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <div className="flex justify-center mb-1">
                <Heart className="h-4 w-4 text-rose-500" />
              </div>
              <p className="text-2xl font-bold tabular-nums">
                {stats?.likes?.toLocaleString() ?? "---"}
              </p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <div className="flex justify-center mb-1">
                <Video className="h-4 w-4 text-violet-500" />
              </div>
              <p className="text-2xl font-bold tabular-nums">
                {stats?.videoCount?.toLocaleString() ?? "---"}
              </p>
              <p className="text-xs text-muted-foreground">Videos</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <div className="flex justify-center mb-1">
                <Play className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold tabular-nums text-emerald-500">
                {stats?.displayName ? "Active" : "---"}
              </p>
              <p className="text-xs text-muted-foreground">Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
