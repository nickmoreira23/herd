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
import { useT } from "@/lib/i18n/locale-context";
import {
  APP_PROVIDER_OPTIONS,
  dataCategoryLabelKey,
} from "@/lib/apps/provider-catalog";

interface AppConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectedSlugs: string[];
  connectingSlug: string | null;
  onConnect: (slug: string) => void;
}

export function AppConnectModal({
  open,
  onOpenChange,
  connectedSlugs,
  connectingSlug,
  onConnect,
}: AppConnectModalProps) {
  const t = useT();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("apps.token_auth.modal.connect_title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          {t("apps.token_auth.modal.connect_subtitle")}
        </p>
        <div className="grid gap-3">
          {APP_PROVIDER_OPTIONS.map((app) => {
            const isConnected = connectedSlugs.includes(app.slug);
            const isConnecting = connectingSlug === app.slug;
            const name = t(app.labelKey);
            return (
              <div
                key={app.slug}
                className="flex items-start gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <img
                  src={app.logoUrl}
                  alt={name}
                  className="h-10 w-10 rounded-lg object-contain shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold">{name}</h4>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-muted/50"
                    >
                      {app.authType}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t(app.descriptionKey)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {app.categoryCodes.map((cat) => (
                      <Badge
                        key={cat}
                        variant="outline"
                        className="text-[10px] bg-violet-500/5 text-violet-500 border-violet-500/20"
                      >
                        {t(dataCategoryLabelKey(cat))}
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
                      {t("apps.token_auth.actions.connecting")}
                    </>
                  ) : isConnected ? (
                    t("apps.token_auth.actions.connected")
                  ) : (
                    <>
                      <Plug className="h-3 w-3 mr-1" />
                      {t("apps.token_auth.actions.connect")}
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
