"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSupportedLocale, type Locale } from "./locales";

/**
 * Persists a locale choice for the current user.
 *
 * Writes both the cookie (for immediate effect, available across the entire
 * session including unauthenticated states) and the NetworkProfile.locale
 * field (for sticky cross-device persistence when the user has an account).
 *
 * The cookie is set with a long expiry (1 year) so the user's choice
 * survives across browser sessions.
 *
 * @throws Error if the locale is not in SUPPORTED_LOCALES.
 */
export async function setLocaleCookie(locale: string): Promise<{ ok: true; locale: Locale }> {
  if (!isSupportedLocale(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  const cookieStore = await cookies();

  // Set cookie — 1 year expiry, scoped to root path.
  cookieStore.set("locale", locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    httpOnly: false, // readable by client for hydration consistency
  });

  // If user is authenticated, persist to NetworkProfile.locale for cross-device.
  // session.user.id IS the NetworkProfile id (single user model — no separate
  // User table; auth.ts maps NetworkProfile→session.user directly).
  try {
    const session = await auth();
    if (session?.user?.id) {
      await prisma.networkProfile.update({
        where: { id: session.user.id },
        data: { locale },
      });
    }
  } catch (e) {
    // Non-fatal: cookie was set successfully even if DB sync failed.
    // Log for ops visibility; user-facing flow continues.
    console.error("[setLocaleCookie] DB sync failed (non-fatal):", e);
  }

  return { ok: true, locale };
}
