"use client";

/**
 * Sub-etapa 22.1.1 — migrated from client-side next-auth/react signIn() to
 * server action (loginAction). Reason: signIn() from next-auth/react uses
 * CSRF cookie fetch + getProviders() round-trips and module-level init that
 * proved brittle after the NEXTAUTH_URL domain change (localhost → lvh.me).
 * With React 19 useActionState + server action, the form submits via Next.js
 * Action protocol (POST + Next-Action header) — no client-side CSRF dependency.
 */

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, {});

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center">
          <div className="text-3xl font-bold text-brand mb-2">ComeçaAI</div>
          <CardTitle className="text-zinc-300 text-lg font-normal">
            Admin Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
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
              disabled={isPending}
              className="w-full bg-brand text-brand-foreground hover:bg-brand-500 font-semibold"
            >
              {isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
