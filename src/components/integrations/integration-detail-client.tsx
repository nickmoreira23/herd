"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConnectModal } from "@/components/integrations/connect-modal";
import { TierMappingRow } from "@/components/integrations/tier-mapping-row";
import { SyncLogTable } from "@/components/integrations/sync-log-table";
import { INTEGRATION_OVERVIEWS } from "@/components/integrations/overviews";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plug,
  ExternalLink,
  BookOpen,
  RefreshCw,
  Loader2,
  Plus,
  Unplug,
} from "lucide-react";

interface IntegrationWithRelations {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  category: string;
  status: string;
  websiteUrl: string | null;
  docsUrl: string | null;
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  createdAt: string;
  tierMappings: Array<{
    id: string;
    externalPlanId: string;
    externalPlanName: string | null;
    subscriptionTierId: string;
    syncDirection: string;
    isActive: boolean;
    subscriptionTier: { id: string; name: string; slug: string };
  }>;
  syncLogs: Array<{
    id: string;
    action: string;
    status: string;
    details: string | null;
    recordsProcessed: number;
    createdAt: string;
  }>;
  webhookEvents: Array<{
    id: string;
    eventType: string;
    payload: string;
    processedAt: string | null;
    error: string | null;
    createdAt: string;
  }>;
}

interface IntegrationDetailClientProps {
  integration: IntegrationWithRelations;
  tiers: { id: string; name: string; slug: string }[];
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: "Available", className: "bg-muted text-muted-foreground" },
  CONNECTED: { label: "Connected", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  ERROR: { label: "Error", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  DISABLED: { label: "Disabled", className: "bg-muted text-muted-foreground opacity-60" },
};

export function IntegrationDetailClient({
  integration: initial,
  tiers,
}: IntegrationDetailClientProps) {
  const router = useRouter();
  const [integration, setIntegration] = useState(initial);
  const [connectOpen, setConnectOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // New mapping form state
  const [newExternalId, setNewExternalId] = useState("");
  const [newExternalName, setNewExternalName] = useState("");
  const [newTierId, setNewTierId] = useState("");

  const isConnected = integration.status === "CONNECTED";
  const statusStyle = STATUS_STYLES[integration.status] || STATUS_STYLES.AVAILABLE;
  const OverviewComponent = INTEGRATION_OVERVIEWS[integration.slug] ?? null;

  const refresh = useCallback(() => {
    router.refresh();
    fetch(`/api/integrations/${integration.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setIntegration(json.data);
      })
      .catch((err) => {
        console.error("Failed to refresh integration:", err);
      });
  }, [integration.id, router]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/integrations/${integration.id}/sync`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Sync failed");
        return;
      }
      toast.success(json.data?.details || "Sync completed");
      refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setSyncing(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch(`/api/integrations/${integration.id}/test`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Test failed");
      } else {
        toast.success("Connection test passed");
      }
      refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch(`/api/integrations/${integration.id}/connect`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Disconnect failed");
        return;
      }
      toast.success("Integration disconnected");
      refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleAddMapping = async () => {
    if (!newExternalId || !newTierId) {
      toast.error("Please fill in both fields");
      return;
    }
    try {
      const res = await fetch(`/api/integrations/${integration.id}/mappings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalPlanId: newExternalId,
          externalPlanName: newExternalName || undefined,
          subscriptionTierId: newTierId,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to create mapping");
        return;
      }
      toast.success("Mapping created");
      setNewExternalId("");
      setNewExternalName("");
      setNewTierId("");
      refresh();
    } catch {
      toast.error("Network error");
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    try {
      const res = await fetch(`/api/integrations/${integration.id}/mappings`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappingId }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to delete mapping");
        return;
      }
      toast.success("Mapping removed");
      refresh();
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div>
        <Link
          href="/admin/integrations"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Integrations
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden shrink-0">
              {integration.logoUrl ? (
                <img
                  src={integration.logoUrl}
                  alt={integration.name}
                  className="h-14 w-14 object-cover"
                />
              ) : (
                <div className="h-14 w-14 flex items-center justify-center bg-muted rounded-xl">
                  <Plug className="h-7 w-7 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{integration.name}</h1>
                <Badge className={statusStyle.className}>
                  {statusStyle.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {integration.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  disabled={testing}
                >
                  {testing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Test Connection
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  {disconnecting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  <Unplug className="h-4 w-4 mr-1" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setConnectOpen(true)}>
                <Plug className="h-4 w-4 mr-1" />
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
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="data-sync">Data Sync</TabsTrigger>
          <TabsTrigger value="logs">Webhooks & Logs</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  {integration.description || "No description."}
                </p>
                <div className="flex gap-3">
                  {integration.websiteUrl && (
                    <a
                      href={integration.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Website
                    </a>
                  )}
                  {integration.docsUrl && (
                    <a
                      href={integration.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Documentation
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Connection Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={statusStyle.className}>
                    {statusStyle.label}
                  </Badge>
                </div>
                {integration.connectedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Connected Since</span>
                    <span>{new Date(integration.connectedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {integration.lastSyncAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Sync</span>
                    <span>{new Date(integration.lastSyncAt).toLocaleString()}</span>
                  </div>
                )}
                {integration.lastSyncError && (
                  <div className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 rounded-md p-2 mt-2">
                    {integration.lastSyncError}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{integration.tierMappings.length}</p>
                    <p className="text-xs text-muted-foreground">Mapped Tiers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{integration.syncLogs.length}</p>
                    <p className="text-xs text-muted-foreground">Sync Logs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{integration.webhookEvents.length}</p>
                    <p className="text-xs text-muted-foreground">Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Integration-specific overview */}
          {OverviewComponent && (
            <OverviewComponent
              integrationId={integration.id}
              integrationSlug={integration.slug}
              isConnected={isConnected}
            />
          )}
        </TabsContent>

        {/* Tab 2: Configuration */}
        <TabsContent value="configuration">
          <div className="max-w-2xl space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isConnected ? (
                  <div className="space-y-3">
                    <div>
                      <Label>API Token</Label>
                      <Input
                        value="••••••••••••••••••••"
                        disabled
                        className="mt-1 font-mono"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTest}
                        disabled={testing}
                      >
                        {testing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        Test Connection
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setConnectOpen(true);
                        }}
                      >
                        Update Token
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Plug className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Connect to start configuring this integration.
                    </p>
                    <Button size="sm" onClick={() => setConnectOpen(true)}>
                      Connect {integration.name}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Data Sync */}
        <TabsContent value="data-sync">
          <div className="space-y-4 mt-4">
            {/* Tier Mappings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Tier Mappings</CardTitle>
                {isConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Sync Plans
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {integration.tierMappings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tier mappings configured yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {integration.tierMappings.map((mapping) => (
                      <TierMappingRow
                        key={mapping.id}
                        mapping={mapping}
                        tiers={tiers}
                        onDelete={handleDeleteMapping}
                      />
                    ))}
                  </div>
                )}

                {/* Add mapping form */}
                {isConnected && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Add New Mapping
                    </p>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">External Plan ID</Label>
                        <Input
                          value={newExternalId}
                          onChange={(e) => setNewExternalId(e.target.value)}
                          placeholder="e.g. 12345"
                          className="mt-2"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Plan Name (optional)</Label>
                        <Input
                          value={newExternalName}
                          onChange={(e) => setNewExternalName(e.target.value)}
                          placeholder="e.g. Monthly Pro"
                          className="mt-2"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">HERD Tier</Label>
                        <Select
                          value={newTierId}
                          onValueChange={(val) => setNewTierId(val ?? "")}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select tier" />
                          </SelectTrigger>
                          <SelectContent>
                            {tiers.map((tier) => (
                              <SelectItem key={tier.id} value={tier.id}>
                                {tier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleAddMapping}
                        className="h-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Webhooks & Logs */}
        <TabsContent value="logs">
          <div className="space-y-4 mt-4">
            {/* Webhook Events */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Webhook Events</CardTitle>
              </CardHeader>
              <CardContent>
                {integration.webhookEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No webhook events received yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {integration.webhookEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 py-2 px-3 rounded-md border bg-card text-sm"
                      >
                        <Badge className="text-[10px] bg-muted text-muted-foreground">
                          {event.eventType}
                        </Badge>
                        <span className="flex-1 text-xs text-muted-foreground truncate">
                          {event.payload.substring(0, 80)}...
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sync Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sync History</CardTitle>
              </CardHeader>
              <CardContent>
                <SyncLogTable logs={integration.syncLogs} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Connect Modal */}
      <ConnectModal
        open={connectOpen}
        onOpenChange={setConnectOpen}
        integrationId={integration.id}
        integrationName={integration.name}
        integrationSlug={integration.slug}
        integrationLogoUrl={integration.logoUrl}
        onConnected={refresh}
      />
    </div>
  );
}
