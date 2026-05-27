"use client";

/**
 * Sub-etapa 22.2 — Org selector list (client component).
 *
 * Renders clickable org cards. On click: calls POST /api/auth/switch-org,
 * receives redirectUrl, navigates via window.location.href (handles
 * cross-origin subdomain redirect that Next.js router can't handle).
 */

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Org {
  orgId: string;
  name: string;
  subdomain: string;
}

interface OrgListProps {
  orgs: Org[];
}

export function OrgList({ orgs }: OrgListProps) {
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  async function handleSelect(orgId: string) {
    setSwitching(orgId);
    setError(null);
    try {
      const res = await fetch("/api/auth/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Erro ao trocar organização");
        setSwitching(null);
        return;
      }
      setRedirectUrl(body.data.redirectUrl);
    } catch {
      setError("Erro de rede. Tente novamente.");
      setSwitching(null);
    }
  }

  if (orgs.length === 0) {
    return (
      <p className="text-center text-zinc-500 text-sm">
        Nenhuma organização ativa encontrada.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {orgs.map((org) => (
        <button
          key={org.orgId}
          onClick={() => handleSelect(org.orgId)}
          disabled={switching !== null}
          className="w-full text-left"
        >
          <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer">
            <CardContent className="py-4 px-5 flex items-center justify-between">
              <div>
                <p className="text-zinc-100 font-medium">{org.name}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{org.subdomain}</p>
              </div>
              {switching === org.orgId && (
                <span className="text-zinc-500 text-xs">Entrando…</span>
              )}
            </CardContent>
          </Card>
        </button>
      ))}
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
    </div>
  );
}
