"use server";

/**
 * Hotfix A — Sub-24 accept flow polish.
 *
 * acceptAndSignInAction replaces the client-side fetch in accept-form.tsx.
 * Running as a server action allows calling signIn() after a new profile is
 * created, establishing the NextAuth session in the same round-trip so the
 * redirect to /admin lands the user already authenticated.
 *
 * Signature: bound to (token, invitationEmail) so formData carries only
 * the optional password fields.
 */

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import {
  acceptInvitation,
  getInvitationByToken,
} from "@/lib/invitations/invitation-service";
import {
  InvitationNotFoundError,
  InvitationAlreadyProcessedError,
  InvitationExpiredError,
  InvitationPasswordRequiredError,
  InvitationPasswordTooShortError,
} from "@/lib/invitations/errors";

export interface AcceptState {
  error?: string;
  redirect?: string;
}

export async function acceptAndSignInAction(
  token: string,
  invitationEmail: string,
  _prevState: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const password = formData.get("password") as string | null;
  const confirmPassword = formData.get("confirmPassword") as string | null;

  // Client-side guard replicated server-side for safety.
  if (
    password !== null &&
    confirmPassword !== null &&
    password !== confirmPassword
  ) {
    return { error: "As senhas não coincidem" };
  }

  try {
    await acceptInvitation({
      token,
      password: password ?? undefined,
    });
  } catch (err) {
    if (err instanceof InvitationNotFoundError) {
      return { error: "Convite não encontrado" };
    }
    if (err instanceof InvitationAlreadyProcessedError) {
      return { error: "Este convite já foi processado" };
    }
    if (err instanceof InvitationExpiredError) {
      return { error: "Este convite expirou" };
    }
    if (err instanceof InvitationPasswordRequiredError) {
      return { error: "Senha obrigatória" };
    }
    if (err instanceof InvitationPasswordTooShortError) {
      return { error: "Senha deve ter no mínimo 8 caracteres" };
    }
    throw err;
  }

  // Build redirect URL to the org's subdomain /admin.
  const data = await getInvitationByToken(token);
  const apexHost = process.env.APEX_HOST ?? "lvh.me";
  const protocol =
    apexHost.includes("localhost") || apexHost === "lvh.me" ? "http" : "https";
  const subdomain = data?.organization.subdomain ?? "";
  const port = process.env.NEXTAUTH_URL?.match(/:(\d+)$/)?.[1];
  const portSuffix = port ? `:${port}` : "";
  const redirectUrl = `${protocol}://${subdomain}.${apexHost}${portSuffix}/admin`;

  // New user path: sign them in so /admin doesn't bounce back to login.
  if (password) {
    try {
      await signIn("credentials", {
        email: invitationEmail,
        password,
        redirect: false,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        // Profile was created and invitation accepted; sign-in failed for
        // an unexpected reason. Redirect anyway — user can log in manually.
        return { redirect: redirectUrl };
      }
      throw error;
    }
  }

  return { redirect: redirectUrl };
}
