"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Building2, List, RefreshCw } from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

interface AttioStats {
  people: number;
  companies: number;
  lists: Array<{ id: { list_id: string }; name: string; api_slug: string }>;
}

export default function AttioOverview({ isConnected }: IntegrationOverviewProps) {
  const [stats, setStats] = useState<AttioStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/attio/stats");
      if (!res.ok) throw new Error("Failed to load Attio data");
      const { data } = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected) fetchData();
  }, [isConnected, fetchData]);

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Connect Attio to view your CRM data.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading Attio data...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{stats?.people ?? 0}</p>
            <p className="text-xs text-muted-foreground">People</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Building2 className="h-5 w-5 mx-auto mb-1 text-violet-500" />
            <p className="text-2xl font-bold">{stats?.companies ?? 0}</p>
            <p className="text-xs text-muted-foreground">Companies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <List className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-bold">{stats?.lists?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Lists</p>
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
      {stats?.lists && stats.lists.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lists</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.lists.map((list) => (
              <div
                key={list.id.list_id}
                className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50"
              >
                <span className="text-sm">{list.name}</span>
                <Badge variant="outline" className="text-[10px]">
                  {list.api_slug}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
