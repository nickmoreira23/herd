"use server";

/**
 * Sub-etapa 22.2 — loginAction updated for multi-org post-login routing.
 *
 * Uses `redirect: false` so Auth.js doesn't throw NEXT_REDIRECT, allowing
 * custom routing logic based on the request context:
 *
 * - Apex + single org  → redirect to org's subdomain /admin
 * - Apex + multi-org   → redirect to /orgs (org selector)
 * - Subdomain          → redirect to /admin (stay on current tenant)
 *
 * Returns { redirect: url } on success — LoginForm handles window.location.href.
 * Returns { error: msg } on failure — LoginForm renders the error inline.
 */

import { headers } from "next/headers";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { isApexDomain } from "@/lib/tenant/org-resolver";

export interface LoginState {
  error?: string;
  redirect?: string;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = (formData.get("email") as string | null) ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou senha inválidos" };
    }
    throw error;
  }

  // Login succeeded. If a safe relative callbackUrl was provided (e.g. the
  // invitation accept flow sends ?callbackUrl=/accept/<token>), honor it so
  // the user returns to where they came from. Only same-origin relative paths
  // are allowed — reject protocol-relative ("//host") and absolute URLs to
  // avoid open-redirect.
  const callbackUrl = (formData.get("callbackUrl") as string | null) ?? "";
  if (callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
    return { redirect: callbackUrl };
  }

  // Otherwise, determine where to redirect from host + memberships.
  const headersList = await headers();
  const host =
    headersList.get("x-host") ??
    headersList.get("host")?.split(":")[0] ??
    "";

  const apexHost = process.env.APEX_HOST ?? "lvh.me";
  const isApex = isApexDomain(host);

  if (!isApex) {
    // Subdomain login — stay on current tenant.
    return { redirect: "/admin" };
  }

  // Apex login — query memberships to decide where to send the user.
  // Look up user by email to get their profile ID.
  const profile = await prisma.networkProfile.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!profile) {
    // Fallback: shouldn't happen since login just succeeded.
    return { redirect: "/admin" };
  }

  const memberships = await prisma.organizationMember.findMany({
    where: {
      networkProfileId: profile.id,
      status: "ACTIVE",
    },
    include: {
      organization: {
        select: { subdomain: true, status: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const activeOrgs = memberships.filter(
    (m) => m.organization.status === "ACTIVE",
  );

  if (activeOrgs.length === 0) {
    // No active org — land on apex (will show empty state).
    return { redirect: "/orgs" };
  }

  if (activeOrgs.length === 1) {
    // Single org — redirect directly to its subdomain.
    const { subdomain } = activeOrgs[0].organization;
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const port = process.env.NODE_ENV === "production" ? "" : ":3000";
    return {
      redirect: `${protocol}://${subdomain}.${apexHost}${port}/admin`,
    };
  }

  // Multiple orgs — let the user choose.
  return { redirect: "/orgs" };
}
