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

// ─── Per-App Auth Configuration ─────────────────────────────────

interface AppAuthInfo {
  name: string;
  logoUrl: string;
  tokenLabel: string;
  tokenPlaceholder: string;
  instructions: string[];
  tokenPortalUrl: string;
  tokenPortalLabel: string;
  scopes: string[];
}

const APP_AUTH_INFO: Record<string, AppAuthInfo> = {
  oura: {
    name: "Oura Ring",
    logoUrl: "/images/apps/oura.svg",
    tokenLabel: "Personal Access Token",
    tokenPlaceholder: "Paste your Oura personal access token",
    instructions: [
      "Sign in to your Oura account at cloud.ouraring.com",
      "Go to Personal Access Tokens in your account settings",
      "Create a new token and copy it",
      "Paste the token below to connect your Oura Ring data",
    ],
    tokenPortalUrl: "https://cloud.ouraring.com/personal-access-tokens",
    tokenPortalLabel: "Oura Token Portal",
    scopes: ["Sleep", "Activity", "Readiness", "Heart Rate"],
  },
  whoop: {
    name: "WHOOP",
    logoUrl: "/images/apps/whoop.svg",
    tokenLabel: "API Access Token",
    tokenPlaceholder: "Paste your WHOOP API access token",
    instructions: [
      "Sign in to the WHOOP Developer Portal at developer.whoop.com",
      "Create or select your application",
      "Generate an access token with the required scopes",
      "Paste the token below to connect your WHOOP data",
    ],
    tokenPortalUrl: "https://developer.whoop.com",
    tokenPortalLabel: "WHOOP Developer Portal",
    scopes: ["Recovery", "Sleep", "Workout", "Body", "Heart Rate"],
  },
  "apple-health": {
    name: "Apple Health",
    logoUrl: "/images/apps/apple-health.svg",
    tokenLabel: "Terra API Key",
    tokenPlaceholder: "Paste your Terra API key",
    instructions: [
      "Sign up at tryterra.co and create a new project",
      "Copy your API key from the Terra dashboard",
      "Paste it below — we use Terra as a bridge to sync Apple Health data",
      "After connecting, you'll authorize data sharing on your iPhone",
    ],
    tokenPortalUrl: "https://tryterra.co",
    tokenPortalLabel: "Terra Dashboard",
    scopes: ["Sleep", "Activity", "Heart Rate", "Workout", "Body", "Nutrition"],
  },
};

// ─── Component ──────────────────────────────────────────────────

interface KnowledgeAppAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appSlug: string | null;
  appId: string | null;
  onSuccess: () => void;
}

export function KnowledgeAppAuthModal({
  open,
  onOpenChange,
  appSlug,
  appId,
  onSuccess,
}: KnowledgeAppAuthModalProps) {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authInfo = appSlug ? APP_AUTH_INFO[appSlug] : null;

  const handleConnect = async () => {
    if (!appId || !token.trim()) return;

    setConnecting(true);
    setError(null);

    try {
      const res = await fetch(`/api/knowledge/apps/${appId}/connect`, {
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
        setError(json.error || "Failed to connect. Please check your token and try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
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

  if (!authInfo) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img
              src={authInfo.logoUrl}
              alt={authInfo.name}
              className="h-8 w-8 rounded-lg object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            Connect {authInfo.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Instructions */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">How to connect:</p>
            <ol className="space-y-1.5">
              {authInfo.instructions.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Portal link */}
          <a
            href={authInfo.tokenPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-violet-500 hover:text-violet-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open {authInfo.tokenPortalLabel}
          </a>

          {/* Data scopes */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Data that will be synced:</p>
            <div className="flex flex-wrap gap-1">
              {authInfo.scopes.map((scope) => (
                <Badge
                  key={scope}
                  variant="outline"
                  className="text-[10px] bg-violet-500/5 text-violet-500 border-violet-500/20"
                >
                  {scope}
                </Badge>
              ))}
            </div>
          </div>

          {/* Token input */}
          <div className="space-y-1.5">
            <Label htmlFor="access-token" className="text-sm">
              {authInfo.tokenLabel}
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
                placeholder={authInfo.tokenPlaceholder}
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
              Your token is encrypted and stored securely. It is only used to sync data from your device.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={connecting}>
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={connecting || !token.trim()}>
              {connecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
