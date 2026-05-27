"use server";

/**
 * Sub-etapa 22.1.1 — server action for login.
 *
 * Replaces the client-side `signIn("credentials", {redirect:false})` from
 * `next-auth/react`. That approach relies on CSRF cookie fetch + `getProviders()`
 * round-trips and on client-side module init, which proved brittle under
 * domain changes (lvh.me DEV TLD). Server actions use Next.js's own form
 * action protocol — built-in CSRF via Origin header, no cookie dance.
 *
 * Success: Auth.js internally calls redirect("/admin") → throws NEXT_REDIRECT →
 *   re-thrown here so Next.js can handle the 303 navigation.
 * Failure: AuthError caught, friendly error message returned to the form.
 */

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = (formData.get("email") as string | null) ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou senha inválidos" };
    }
    // Re-throw NEXT_REDIRECT so Next.js can handle the navigation.
    throw error;
  }

  // signIn with redirectTo always throws NEXT_REDIRECT on success.
  // This line is unreachable but satisfies the return type.
  return {};
}
