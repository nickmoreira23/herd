"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  Calendar,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface CalendarIntegration {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  status: string;
  connectedAt: string | null;
  description: string | null;
  configured: boolean;
}

const SETUP_LINKS: Record<string, { url: string; label: string }> = {
  "google-calendar": {
    url: "https://console.cloud.google.com/apis/credentials",
    label: "Google Cloud Console",
  },
  "microsoft-outlook": {
    url: "https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps",
    label: "Azure Portal",
  },
  zoom: {
    url: "https://marketplace.zoom.us/develop/create",
    label: "Zoom Marketplace",
  },
};

interface ConnectCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

// ─── Component ──────────────────────────────────────────────────

export function ConnectCalendarDialog({
  open,
  onOpenChange,
  onConnected,
}: ConnectCalendarDialogProps) {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingSlug, setConnectingSlug] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/calendar-status");
      const json = await res.json();
      if (json.data) setIntegrations(json.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchIntegrations();
    }
  }, [open, fetchIntegrations]);

  // Check URL for ?connected= param (returning from OAuth)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    if (connected) {
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.pathname + url.search);
      // Refresh data
      onConnected?.();
    }
  }, [onConnected]);

  const handleConnect = async (integration: CalendarIntegration) => {
    setConnectingSlug(integration.slug);

    try {
      const res = await fetch("/api/integrations/oauth/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId: integration.id,
          returnTo: "/admin/blocks/meetings",
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error(json?.error || `Failed to connect ${integration.name}`);
        setConnectingSlug(null);
        return;
      }

      const { data } = await res.json();
      window.location.href = data.authorizeUrl;
    } catch {
      toast.error("Network error. Please try again.");
      setConnectingSlug(null);
    }
  };

  const connectedCount = integrations.filter((i) => i.status === "CONNECTED").length;
  const anyConfigured = integrations.some((i) => i.configured);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Connect Calendar
          </DialogTitle>
          <DialogDescription>
            Connect your calendar to automatically sync meetings and enable
            recording bots.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {loading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </>
          ) : integrations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No calendar integrations available. Please run the database seed
              to set up integrations.
            </p>
          ) : (
            integrations.map((integration) => {
              const isConnected = integration.status === "CONNECTED";
              const isConnecting = connectingSlug === integration.slug;
              const setup = SETUP_LINKS[integration.slug];

              return (
                <div
                  key={integration.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                    isConnected
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  {integration.logoUrl ? (
                    <img
                      src={integration.logoUrl}
                      alt={integration.name}
                      className="h-10 w-10 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{integration.name}</p>
                      {isConnected && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-0.5" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {isConnected && integration.connectedAt
                        ? `Connected ${new Date(integration.connectedAt).toLocaleDateString()}`
                        : !integration.configured
                          ? "OAuth credentials not configured"
                          : integration.description}
                    </p>
                  </div>

                  {isConnected ? (
                    <a href={`/admin/integrations/${integration.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs h-8">
                        Manage
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </a>
                  ) : integration.configured ? (
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleConnect(integration)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  ) : setup ? (
                    <a href={setup.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        Setup
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </a>
                  ) : (
                    <Button variant="outline" size="sm" className="h-8 text-xs" disabled>
                      Setup Required
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {!loading && !anyConfigured && integrations.length > 0 && (
          <div className="flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-0.5">OAuth credentials required</p>
              <p>
                Add your OAuth client ID and secret to{" "}
                <code className="text-[10px] bg-muted px-1 py-0.5 rounded">.env</code>{" "}
                for each calendar provider. Click &quot;Setup&quot; to open the developer console.
              </p>
            </div>
          </div>
        )}

        {connectedCount > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {connectedCount} of {integrations.length} calendar
            {integrations.length !== 1 ? "s" : ""} connected
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
