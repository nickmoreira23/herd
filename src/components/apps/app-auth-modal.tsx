"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import {
  getProviderMeta,
  getProviderTokenAuth,
  dataCategoryLabelKey,
} from "@/lib/apps/provider-catalog";
import { notifyError } from "@/lib/i18n/notify";

interface AppAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appSlug: string | null;
  appId: string | null;
  onSuccess: () => void;
}

export function AppAuthModal({
  open,
  onOpenChange,
  appSlug,
  appId,
  onSuccess,
}: AppAuthModalProps) {
  const t = useT();
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = appSlug ? getProviderMeta(appSlug) : null;
  const tokenAuth = appSlug ? getProviderTokenAuth(appSlug) : null;

  const handleConnect = async () => {
    if (!appId || !token.trim()) return;

    setConnecting(true);
    setError(null);

    try {
      const res = await fetch(`/api/apps/${appId}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token.trim() }),
      });

      const json = await res.json();

      if (res.ok) {
        setToken("");
        setShowToken(false);
        onOpenChange(false);
        onSuccess();
      } else {
        setError(json.error || t("error.apps.connect_failed"));
      }
    } catch {
      setError(t("error.apps.network"));
    } finally {
      setConnecting(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setToken("");
      setShowToken(false);
      setError(null);
    }
    onOpenChange(isOpen);
  };

  if (!meta || !tokenAuth) {
    // Surface a toast in dev so the missing provider is obvious.
    if (appSlug) {
      notifyError("error.apps.app_not_found", t, { slug: appSlug });
    }
    return null;
  }

  const name = t(meta.labelKey);
  const portalUrl = t(tokenAuth.portalUrlKey);
  const portalLabel = t(tokenAuth.portalLabelKey);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img
              src={meta.logoUrl}
              alt={name}
              className="h-8 w-8 rounded-lg object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {t("apps.token_auth.modal.connect_app_title", { name })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Instructions */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">
              {t("apps.token_auth.modal.instructions_title")}
            </p>
            <ol className="space-y-1.5">
              {tokenAuth.stepKeys.map((stepKey, i) => (
                <li key={stepKey} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{t(stepKey)}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Portal link */}
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-violet-500 hover:text-violet-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("apps.token_auth.modal.open_portal", { label: portalLabel })}
          </a>

          {/* Data scopes */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">
              {t("apps.token_auth.modal.scopes_title")}
            </p>
            <div className="flex flex-wrap gap-1">
              {tokenAuth.scopeCodes.map((scope) => (
                <Badge
                  key={scope}
                  variant="outline"
                  className="text-[10px] bg-violet-500/5 text-violet-500 border-violet-500/20"
                >
                  {t(dataCategoryLabelKey(scope))}
                </Badge>
              ))}
            </div>
          </div>

          {/* Token input */}
          <div className="space-y-1.5">
            <Label htmlFor="access-token" className="text-sm">
              {t(tokenAuth.tokenLabelKey)}
            </Label>
            <div className="relative">
              <Input
                id="access-token"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t(tokenAuth.tokenPlaceholderKey)}
                className="pr-10"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Security note */}
          <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {t("apps.token_auth.modal.security_note")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={connecting}>
              {t("apps.token_auth.actions.cancel")}
            </Button>
            <Button onClick={handleConnect} disabled={connecting || !token.trim()}>
              {connecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  {t("apps.token_auth.actions.connecting")}
                </>
              ) : (
                t("apps.token_auth.actions.connect")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
