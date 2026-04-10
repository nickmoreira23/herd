"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, RefreshCw, Users, Building2, Mail } from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface LinkedInOrganization {
  id: string;
  name: string;
  vanityName?: string;
}

interface LinkedInStats {
  name: string;
  email: string;
  organizations: LinkedInOrganization[];
}

// ─── Component ───────────────────────────────────────────────────

export default function LinkedInOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [stats, setStats] = useState<LinkedInStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch("/api/integrations/linkedin/stats")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setStats(json.data);
        else setError(json.error || "Failed to load LinkedIn stats");
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
            Connect LinkedIn to view your profile and organizations.
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
              <Skeleton className="h-4 w-40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
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
      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">LinkedIn Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <Users className="h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{stats?.name ?? "---"}</p>
                <p className="text-[10px] text-muted-foreground">Profile Name</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <Mail className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{stats?.email ?? "---"}</p>
                <p className="text-[10px] text-muted-foreground">Email</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organizations */}
      {stats?.organizations && stats.organizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Organizations
              <span className="text-muted-foreground font-normal ml-1.5">
                ({stats.organizations.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.organizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                    <Building2 className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{org.name}</p>
                    {org.vanityName && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {org.vanityName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats?.organizations && stats.organizations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Building2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No organizations found for this account.
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
