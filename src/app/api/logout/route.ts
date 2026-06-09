import { NextResponse } from "next/server";

// Complements the built-in Auth.js sign-out. The built-in expiry derives from
// the write-config (src/lib/auth.ts), which scopes the session cookie to
// Domain=COOKIE_DOMAIN — so it only clears the domain-scoped cookie. Browsers
// that still hold a host-only session cookie from a pre-Sub-22.1 login (before
// COOKIE_DOMAIN existed) keep it alive, and proxy.ts reads cookie presence as
// "logged in" → /login bounces back to /admin. We expire the session cookie in
// BOTH scopes (host-only AND Domain=COOKIE_DOMAIN) with attributes matching the
// write-config so no survivor remains.
export function buildSessionClearCookieHeaders(opts: {
  isProduction: boolean;
  cookieDomain?: string;
}): string[] {
  const name = opts.isProduction
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const attrs = ["Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (opts.isProduction) attrs.push("Secure");

  const hostOnly = `${name}=; ${attrs.join("; ")}`;
  const headers = [hostOnly];

  if (opts.cookieDomain) {
    headers.push(`${name}=; ${attrs.join("; ")}; Domain=${opts.cookieDomain}`);
  }

  return headers;
}

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const cookies = buildSessionClearCookieHeaders({
    isProduction: process.env.NODE_ENV === "production",
    cookieDomain: process.env.COOKIE_DOMAIN,
  });
  for (const cookie of cookies) {
    res.headers.append("Set-Cookie", cookie);
  }
  return res;
}
