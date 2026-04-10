"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, RefreshCw, CheckCircle2, UserCircle, Mic, Video, LayoutTemplate } from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface HeyGenStats {
  avatarCount: number;
  voiceCount: number;
  videoCount: number;
  templateCount: number;
}

// ─── Component ───────────────────────────────────────────────────

export default function HeyGenOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [stats, setStats] = useState<HeyGenStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch("/api/integrations/heygen/stats")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setStats(json.data);
        else setError(json.error || "Failed to load HeyGen stats");
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
            <UserCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Connect HeyGen to generate AI avatar videos with V5 technology.
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
            <div className="grid grid-cols-4 gap-4">
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
            <UserCircle className="h-6 w-6 text-red-500" />
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
          <CardTitle className="text-sm">HeyGen Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border px-4 py-3 text-center">
              <div className="flex justify-center mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold tabular-nums text-emerald-500">
                Active
              </p>
              <p className="text-xs text-muted-foreground">API Key</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <div className="flex justify-center mb-1">
                <UserCircle className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold tabular-nums">
                {stats?.avatarCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Avatars</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <div className="flex justify-center mb-1">
                <Video className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold tabular-nums">
                {stats?.videoCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Videos</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <div className="flex justify-center mb-1">
                <LayoutTemplate className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold tabular-nums">
                {stats?.templateCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Templates</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 pb-4 space-y-2">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-violet-500" />
            <p className="text-sm font-medium">Capabilities</p>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
            <li>V5 AI Avatar video generation</li>
            <li>100+ stock avatars and custom avatar creation</li>
            <li>300+ voices across 40+ languages</li>
            <li>Text-to-video with lip sync</li>
            <li>Template-based video creation</li>
          </ul>
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
