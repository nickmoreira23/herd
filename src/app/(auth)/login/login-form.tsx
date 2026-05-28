"use client";

/**
 * Sub-etapa 22.2 — LoginForm client component.
 *
 * Extracted from page.tsx (which became an RSC for per-host branding).
 * Receives orgName + optional errorParam as props from the server component.
 *
 * useActionState stays client-side (React 19 hook, requires client boundary).
 *
 * Handles two action outcomes:
 * - state.error   → renders inline error message
 * - state.redirect → navigates via window.location.href (handles cross-origin
 *   subdomain redirects that Next.js router can't do)
 */

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAction } from "./actions";

interface LoginFormProps {
  orgName: string;
  errorParam?: string;
  callbackUrl?: string;
}

export function LoginForm({ orgName, errorParam, callbackUrl }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, {});

  useEffect(() => {
    if (state.redirect) {
      window.location.href = state.redirect;
    }
  }, [state.redirect]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center">
          {errorParam === "org_not_found" && (
            <div className="mb-3 p-3 bg-red-900/30 border border-red-700 rounded-md text-red-200 text-sm text-left">
              Organização não encontrada. Verifique o link ou faça login no
              domínio principal.
            </div>
          )}
          <div className="text-3xl font-bold text-brand mb-2">{orgName}</div>
          <CardTitle className="text-zinc-300 text-lg font-normal">
            Admin Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {callbackUrl && (
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-400">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="voce@empresa.com"
                required
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-400">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            {state?.error && (
              <p className="text-sm text-red-400">{state.error}</p>
            )}
            <Button
              type="submit"
              disabled={isPending || !!state.redirect}
              className="w-full bg-brand text-brand-foreground hover:bg-brand-500 font-semibold"
            >
              {isPending || state.redirect ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
