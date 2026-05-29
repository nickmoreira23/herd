"use client";

import { useState, useEffect, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { acceptAndSignInAction, type AcceptState } from "./actions";
import { useT } from "@/lib/i18n/locale-context";

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
  const t = useT();
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
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-foreground">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          {t("invitations.accept.heading")}
        </h1>
        <p className="text-gray-500 mb-6">
          {t("invitations.accept.subheading")} <strong>{organization.name}</strong>
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
              {t("invitations.accept.logged_as")} <strong>{invitationEmail}</strong>
            </p>
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !!state.redirect}
            >
              {isPending || state.redirect
                ? t("invitations.accept.accepting")
                : t("invitations.accept.accept_button")}
            </Button>
          </form>
        )}

        {/* Case 2: profile exists + no session → direct to login */}
        {profileExists && !sessionActive && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              {t("invitations.accept.login_prompt")} <strong>{invitationEmail}</strong>{" "}
              {t("invitations.accept.login_prompt_suffix")}
            </p>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/accept/${token}`)}`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 w-full"
            >
              {t("invitations.accept.login_link")}
            </Link>
          </div>
        )}

        {/* Case 3: profile doesn't exist → create account form */}
        {!profileExists && (
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="email-display" className="text-gray-700">{t("invitations.accept.field_email")}</Label>
              <Input
                id="email-display"
                type="email"
                value={invitationEmail}
                readOnly
                className="bg-gray-50 text-gray-900 border-gray-300 mt-3"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-700">{t("invitations.accept.field_password")}</Label>
              <div className="relative mt-3">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                  required
                  placeholder={t("invitations.accept.password_placeholder")}
                  className="text-gray-900 border-gray-300"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword
                    ? t("invitations.accept.hide_password")
                    : t("invitations.accept.show_password")}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700">{t("invitations.accept.field_confirm_password")}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                minLength={8}
                required
                placeholder={t("invitations.accept.confirm_password_placeholder")}
                className="text-gray-900 border-gray-300 mt-3"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !!state.redirect}
            >
              {isPending || state.redirect
                ? t("invitations.accept.creating")
                : t("invitations.accept.create_and_accept")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
