import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { resolveActiveOrgIdForProfile } from "@/lib/auth/resolve-active-org";

// DEV-ONLY passwordless login — lets local tooling / the preview agent
// re-authenticate as the admin without typing a password, so the preview
// session survives across rounds.
//
// SECURITY — triple-gated, INERT in production:
//   1. `NODE_ENV === "production"` ⇒ 404 (primary gate — cannot run in prod).
//   2. `DEV_LOGIN_SECRET` must be set (only in local `.env.local`, NEVER in
//      Railway). Missing ⇒ 404.
//   3. `?secret=` must match `DEV_LOGIN_SECRET`. Mismatch ⇒ 404.
//   4. Host must be localhost / 127.0.0.1 / *.lvh.me (defense in depth).
// Even if the secret somehow leaked into prod, gate 1 still returns 404.
// The route is in `PUBLIC_API_MATCHERS` (proxy) only so the 404 is reachable;
// it grants nothing in prod.

const COOKIE_NAME = "authjs.session-token"; // DEV cookie name (non-`__Secure-`)
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|(.*\.)?lvh\.me)(:\d+)?$/;

function notFound() {
  return new NextResponse("Not found", { status: 404 });
}

export async function GET(request: Request) {
  // Reading a Dynamic API forces per-request evaluation (never static-cached)
  // and gives us the host for the local-only gate.
  const host = (await headers()).get("host") ?? "";

  if (process.env.NODE_ENV === "production") return notFound();
  const expected = process.env.DEV_LOGIN_SECRET;
  if (!expected) return notFound();
  if (!LOCAL_HOST.test(host)) return notFound();

  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== expected) return notFound();

  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  const email = process.env.ADMIN_EMAIL;
  if (!secret || !email) return notFound();

  const user = await prisma.networkProfile.findUnique({ where: { email } });
  if (!user) return notFound();

  const activeOrgId = await resolveActiveOrgIdForProfile(user.id);
  const name = `${user.firstName}${user.lastName ? " " + user.lastName : ""}`.trim();

  // Mint a session JWT shaped exactly like the `jwt` callback in auth.ts so the
  // `session` callback + downstream guards (requireSuperAdmin) read it cleanly.
  const token = await encode({
    salt: COOKIE_NAME,
    secret,
    maxAge: MAX_AGE_SECONDS,
    token: {
      sub: user.id,
      email: user.email,
      name,
      role: "super_admin",
      dbId: user.id,
      activeOrgId: activeOrgId ?? null,
      isSuperAdmin: true,
    },
  });

  const res = NextResponse.redirect(new URL("/admin", request.url));
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false, // DEV only — never reached in production (gate 1)
    domain: process.env.COOKIE_DOMAIN ?? undefined,
    maxAge: MAX_AGE_SECONDS,
  });
  return res;
}
