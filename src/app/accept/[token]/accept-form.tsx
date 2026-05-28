"use client";

import { useState, useEffect, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { acceptAndSignInAction, type AcceptState } from "./actions";

interface AcceptFormProps {
  token: string;
  organization: {
    id: string;
    name: string;
    subdomain: string;
  };
  invitationEmail: string;
  profileExists: boolean;
  sessionActive: boolean;
}

export function AcceptForm({
  token,
  organization,
  invitationEmail,
  profileExists,
  sessionActive,
}: AcceptFormProps) {
  const boundAcceptAction = acceptAndSignInAction.bind(null, token, invitationEmail);
  const [state, formAction, isPending] = useActionState<AcceptState, FormData>(
    boundAcceptAction,
    {}
  );
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.redirect) {
      window.location.href = state.redirect;
    }
  }, [state.redirect]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          Você foi convidado
        </h1>
        <p className="text-gray-500 mb-6">
          para <strong>{organization.name}</strong>
        </p>

        {state.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {state.error}
          </div>
        )}

        {/* Case 1: profile exists + session active → one-click accept */}
        {profileExists && sessionActive && (
          <form action={formAction}>
            <p className="text-sm text-gray-600 mb-4">
              Logado como <strong>{invitationEmail}</strong>
            </p>
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !!state.redirect}
            >
              {isPending || state.redirect ? "Aceitando..." : "Aceitar convite"}
            </Button>
          </form>
        )}

        {/* Case 2: profile exists + no session → direct to login */}
        {profileExists && !sessionActive && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Faça login com <strong>{invitationEmail}</strong> para aceitar este convite.
            </p>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/accept/${token}`)}`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 w-full"
            >
              Fazer login
            </Link>
          </div>
        )}

        {/* Case 3: profile doesn't exist → create account form */}
        {!profileExists && (
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="email-display">E-mail</Label>
              <Input
                id="email-display"
                type="email"
                value={invitationEmail}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                  required
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                minLength={8}
                required
                placeholder="Repita a senha"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !!state.redirect}
            >
              {isPending || state.redirect ? "Criando conta..." : "Criar conta e aceitar"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
