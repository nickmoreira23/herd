"use client";

import { useState } from "react";
import { CheckCircle2, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ConnectModal } from "@/components/integrations/connect-modal";
import type { IntegrationRow } from "./types";

// ─── Types ──────────────────────────────────────────────────────

interface IntegrateCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrations: IntegrationRow[];
}

// ─── Component ──────────────────────────────────────────────────

export function IntegrateCalendarDialog({
  open,
  onOpenChange,
  integrations,
}: IntegrateCalendarDialogProps) {
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<IntegrationRow | null>(null);

  const handleConnect = (integration: IntegrationRow) => {
    setSelectedIntegration(integration);
    setConnectModalOpen(true);
  };

  const handleConnected = () => {
    setConnectModalOpen(false);
    setSelectedIntegration(null);
    // Close the parent dialog too — user can re-open to see updated state
    onOpenChange(false);
    // Reload the page to get fresh integration + calendar data
    window.location.reload();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect Calendar</DialogTitle>
            <DialogDescription>
              Connect a calendar service to sync your events automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            {integrations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Plug className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No calendar integrations available.
                </p>
              </div>
            ) : (
              integrations.map((integration) => {
                const isConnected = integration.status === "CONNECTED";

                return (
                  <div
                    key={integration.id}
                    className="flex items-center gap-4 rounded-lg border border-border p-4"
                  >
                    {/* Logo */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0 overflow-hidden">
                      {integration.logoUrl ? (
                        <img
                          src={integration.logoUrl}
                          alt={integration.name}
                          className="h-6 w-6 object-contain"
                        />
                      ) : (
                        <Plug className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{integration.name}</p>
                      {integration.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {integration.description}
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    {isConnected ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 shrink-0">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium">Connected</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnect(integration)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reusable ConnectModal for OAuth flow */}
      {selectedIntegration && (
        <ConnectModal
          open={connectModalOpen}
          onOpenChange={setConnectModalOpen}
          integrationId={selectedIntegration.id}
          integrationName={selectedIntegration.name}
          integrationSlug={selectedIntegration.slug}
          integrationLogoUrl={selectedIntegration.logoUrl}
          onConnected={handleConnected}
        />
      )}
    </>
  );
}
