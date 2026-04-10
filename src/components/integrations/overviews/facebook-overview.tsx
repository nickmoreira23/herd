"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, RefreshCw, Users, FileText } from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface FacebookPage {
  id: string;
  name: string;
  category: string;
  fans: number;
}

interface FacebookStats {
  name: string;
  totalPages: number;
  pages: FacebookPage[];
}

// ─── Component ───────────────────────────────────────────────────

export default function FacebookOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [stats, setStats] = useState<FacebookStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch("/api/integrations/facebook/stats")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setStats(json.data);
        else setError(json.error || "Failed to load Facebook stats");
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
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Connect Facebook to view your pages and audience data.
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
            <Skeleton className="h-5 w-48 mb-4" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rounded-lg border px-4 py-3 text-center">
                  <Skeleton className="h-7 w-10 mx-auto mb-1" />
                  <Skeleton className="h-3 w-14 mx-auto" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
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
            <Users className="h-6 w-6 text-red-500" />
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
      {/* User & Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Facebook Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.name && (
            <p className="text-sm font-medium mb-4">{stats.name}</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border px-4 py-3 text-center">
              <div className="flex justify-center mb-1">
                <FileText className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold tabular-nums">
                {stats?.totalPages ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Total Pages</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <div className="flex justify-center mb-1">
                <Users className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold tabular-nums">
                {stats?.pages?.reduce((sum, p) => sum + (p.fans || 0), 0)?.toLocaleString() ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Total Fans</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pages List */}
      {stats?.pages && stats.pages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Pages
              <span className="text-muted-foreground font-normal ml-1.5">
                ({stats.pages.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                    <FileText className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{page.name}</p>
                    {page.category && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {page.category}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {page.fans?.toLocaleString() ?? 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats?.pages && stats.pages.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No pages found for this account.
            </p>
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
