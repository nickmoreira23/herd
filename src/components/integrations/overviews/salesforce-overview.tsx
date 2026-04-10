"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Building2, Target, UserPlus, RefreshCw } from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

interface SalesforceStats {
  accounts: number;
  contacts: number;
  opportunities: number;
  leads: number;
}

export default function SalesforceOverview({ isConnected }: IntegrationOverviewProps) {
  const [stats, setStats] = useState<SalesforceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/salesforce/stats");
      if (!res.ok) throw new Error("Failed to load Salesforce data");
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
          Connect Salesforce to view your CRM data.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading Salesforce data...
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
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Building2 className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{stats?.accounts ?? 0}</p>
            <p className="text-xs text-muted-foreground">Accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-violet-500" />
            <p className="text-2xl font-bold">{stats?.contacts ?? 0}</p>
            <p className="text-xs text-muted-foreground">Contacts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-bold">{stats?.opportunities ?? 0}</p>
            <p className="text-xs text-muted-foreground">Opportunities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <UserPlus className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold">{stats?.leads ?? 0}</p>
            <p className="text-xs text-muted-foreground">Leads</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
