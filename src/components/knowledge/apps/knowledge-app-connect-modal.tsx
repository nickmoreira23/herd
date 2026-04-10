"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plug, Loader2 } from "lucide-react";

const APP_CATALOG = [
  {
    slug: "oura",
    name: "Oura Ring",
    description: "Sleep, activity, and readiness tracking from your Oura Ring.",
    logoUrl: "/images/apps/oura.svg",
    categories: ["Sleep", "Activity", "Readiness", "Heart Rate"],
    authType: "OAuth2",
  },
  {
    slug: "whoop",
    name: "WHOOP",
    description: "Recovery, strain, sleep, and workout data from your WHOOP strap.",
    logoUrl: "/images/apps/whoop.svg",
    categories: ["Sleep", "Recovery", "Workout", "Body", "Heart Rate"],
    authType: "OAuth2",
  },
  {
    slug: "apple-health",
    name: "Apple Health",
    description: "Aggregated health data from Apple Health via Terra API bridge.",
    logoUrl: "/images/apps/apple-health.svg",
    categories: ["Sleep", "Activity", "Heart Rate", "Workout", "Body", "Nutrition"],
    authType: "OAuth2",
  },
] as const;

interface KnowledgeAppConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectedSlugs: string[];
  connectingSlug: string | null;
  onConnect: (slug: string) => void;
}

export function KnowledgeAppConnectModal({
  open,
  onOpenChange,
  connectedSlugs,
  connectingSlug,
  onConnect,
}: KnowledgeAppConnectModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Connect App</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          Choose a fitness app to connect. Your health data will be synced and
          made available to your AI agents.
        </p>
        <div className="grid gap-3">
          {APP_CATALOG.map((app) => {
            const isConnected = connectedSlugs.includes(app.slug);
            const isConnecting = connectingSlug === app.slug;
            return (
              <div
                key={app.slug}
                className="flex items-start gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <img
                  src={app.logoUrl}
                  alt={app.name}
                  className="h-10 w-10 rounded-lg object-contain shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold">{app.name}</h4>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-muted/50"
                    >
                      {app.authType}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {app.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {app.categories.map((cat) => (
                      <Badge
                        key={cat}
                        variant="outline"
                        className="text-[10px] bg-violet-500/5 text-violet-500 border-violet-500/20"
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isConnected ? "outline" : "default"}
                  disabled={isConnected || isConnecting || (connectingSlug !== null && !isConnecting)}
                  onClick={() => onConnect(app.slug)}
                  className="shrink-0"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Connecting...
                    </>
                  ) : isConnected ? (
                    "Connected"
                  ) : (
                    <>
                      <Plug className="h-3 w-3 mr-1" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
