"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plug } from "lucide-react";
import { ConnectModal } from "@/components/integrations/connect-modal";
import type { Integration } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  BILLING: "Billing",
  PAYMENT: "Payment",
  CRM: "CRM",
  ANALYTICS: "Analytics",
  MARKETING: "Marketing",
  COMMUNICATION: "Communication",
  SUPPORT: "Support",
  MEETINGS: "Meetings",
  PROJECT_MANAGEMENT: "Project Management",
  SOCIAL_MEDIA: "Social Media",
  AI_MODELS: "AI Models",
  OTHER: "Other",
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: "Available", className: "bg-muted text-muted-foreground" },
  CONNECTED: { label: "Connected", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  ERROR: { label: "Error", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  DISABLED: { label: "Disabled", className: "bg-muted text-muted-foreground opacity-60" },
};

const CATEGORY_STYLES: Record<string, string> = {
  BILLING: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  PAYMENT: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CRM: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ANALYTICS: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  MARKETING: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  COMMUNICATION: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  SUPPORT: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  MEETINGS: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  PROJECT_MANAGEMENT: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  SOCIAL_MEDIA: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  AI_MODELS: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  OTHER: "bg-muted text-muted-foreground",
};

interface IntegrationCardProps {
  integration: Integration;
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const router = useRouter();
  const [connectOpen, setConnectOpen] = useState(false);

  const statusStyle = STATUS_STYLES[integration.status] || STATUS_STYLES.AVAILABLE;
  const categoryStyle = CATEGORY_STYLES[integration.category] || CATEGORY_STYLES.OTHER;

  const isConnected = integration.status === "CONNECTED";
  const isError = integration.status === "ERROR";

  const handleAction = () => {
    if (isConnected) {
      // Already connected — go to detail/manage page
      router.push(`/admin/integrations/${integration.id}`);
    } else {
      // Not connected — open the connect modal directly
      setConnectOpen(true);
    }
  };

  const handleConnected = () => {
    // After successful connection, navigate to the detail page
    router.push(`/admin/integrations/${integration.id}`);
  };

  return (
    <>
      <Card className="group relative flex flex-col hover:shadow-md transition-shadow">
        <CardContent className="flex flex-col gap-4 p-5 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl overflow-hidden shrink-0">
                {integration.logoUrl ? (
                  <img
                    src={integration.logoUrl}
                    alt={integration.name}
                    className="h-11 w-11 object-cover"
                  />
                ) : (
                  <div className="h-11 w-11 flex items-center justify-center bg-muted rounded-xl">
                    <Plug className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{integration.name}</h3>
                <Badge className={`mt-0.5 text-[10px] ${categoryStyle}`}>
                  {CATEGORY_LABELS[integration.category] || integration.category}
                </Badge>
              </div>
            </div>
            <Badge className={`text-[10px] ${statusStyle.className}`}>
              {statusStyle.label}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
            {integration.description || "No description available."}
          </p>

          {/* Actions */}
          <div className="pt-1">
            <Button
              variant={isConnected ? "outline" : "default"}
              size="sm"
              className="w-full text-xs"
              onClick={handleAction}
            >
              {isConnected ? "Manage" : isError ? "Reconnect" : "Connect"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConnectModal
        open={connectOpen}
        onOpenChange={setConnectOpen}
        integrationId={integration.id}
        integrationName={integration.name}
        integrationSlug={integration.slug}
        integrationLogoUrl={integration.logoUrl}
        onConnected={handleConnected}
      />
    </>
  );
}
