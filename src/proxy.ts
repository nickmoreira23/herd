import { NextRequest, NextResponse } from "next/server";
import {
  isSupportedLocale,
  normalizeLocale,
  DEFAULT_LOCALE,
} from "@/lib/i18n/locales";
import { resolveOrgByHost, isApexDomain } from "@/lib/tenant/org-resolver";

// Surfaces públicas que devem ter prefixo de locale na URL.
// Admin/api/auth ficam flat (cookie resolve).
const PUBLIC_LOCALE_PREFIXES = ["/p", "/f", "/explore", "/shared"];

function isPublicLocaleRoute(pathname: string): boolean {
  return PUBLIC_LOCALE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

function extractLocaleFromPath(
  pathname: string,
): { locale: string; rest: string } | null {
  const match = pathname.match(/^\/([a-z]{2}-[A-Z]{2})(\/.*)?$/);
  if (!match) return null;
  return { locale: match[1], rest: match[2] ?? "/" };
}

/**
 * CRAVADO Sub-etapa 22 V2:
 * - Node runtime (via proxy.ts) — Prisma/pg compatible.
 * - Resolves tenant via host header.
 * - Injects x-org-id, x-host, x-is-apex headers.
 * - Preserves auth gate + locale handling from the former middleware.ts.
 *
 * V2 does NOT include:
 * - Redirect when subdomain is invalid → Sub-etapa 22.1.
 * - Cookie domain config → Sub-etapa 22.1.
 * - Apex auto-redirect / org selector → Sub-etapa 22.2.
 */
export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0].toLowerCase();
  const { pathname } = request.nextUrl;

  // ─── 1. Tenant resolution ────────────────────────────────────────────
  const orgId = await resolveOrgByHost(host);
  const isApex = isApexDomain(hostname);

  // Build base request headers forwarded to all subsequent branches.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  if (orgId) requestHeaders.set("x-org-id", orgId);
  requestHeaders.set("x-host", hostname);
  requestHeaders.set("x-is-apex", String(isApex));
  const localeOverride = request.nextUrl.searchParams.get("locale");
  if (localeOverride) requestHeaders.set("x-locale-override", localeOverride);

  // ─── 2. Auth gate (preserved) ────────────────────────────────────────
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;
  const isLoggedIn = !!sessionToken;

  if (pathname.startsWith("/admin") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // ─── 3. Public route locale handling (preserved) ─────────────────────
  const extracted = extractLocaleFromPath(pathname);
  const restAfterLocale = extracted ? extracted.rest : pathname;
  const isPublic = isPublicLocaleRoute(restAfterLocale);

  if (isPublic && extracted) {
    // Case A: URL has locale prefix (e.g. /pt-BR/p/abc).
    if (!isSupportedLocale(extracted.locale)) {
      // Invalid locale prefix — 308 to default.
      const url = request.nextUrl.clone();
      url.pathname = `/${DEFAULT_LOCALE}${extracted.rest}`;
      return NextResponse.redirect(url, 308);
    }

    // Valid prefix — sync cookie if it differs from URL, then forward.
    const cookieLocale = request.cookies.get("locale")?.value;
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    if (cookieLocale !== extracted.locale) {
      res.cookies.set("locale", extracted.locale, {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        sameSite: "lax",
        httpOnly: false,
      });
    }
    return res;
  }

  if (isPublic && !extracted) {
    // Case B: URL is public but lacks locale prefix (e.g. /p/abc).
    // 308 to /{cookie-or-accept-or-default}/p/abc.
    const cookieLocale = request.cookies.get("locale")?.value;
    const accept = request.headers.get("accept-language");
    const acceptLocale = accept
      ? normalizeLocale(accept.split(",")[0]?.split(";")[0])
      : null;

    const targetLocale =
      cookieLocale && isSupportedLocale(cookieLocale)
        ? cookieLocale
        : (acceptLocale ?? DEFAULT_LOCALE);

    const url = request.nextUrl.clone();
    url.pathname = `/${targetLocale}${pathname}`;
    return NextResponse.redirect(url, 308);
  }

  // ─── 4. Default path — forward enriched headers ───────────────────────
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // CRAVADO Sub-etapa 23 expansion: /api/:path* added so proxy injects
    // x-org-id into API route handler requests (sidebar fetch, page data fetches).
    // Without this, browser fetch("/api/departments") bypasses proxy — no x-org-id.
    "/api/:path*",
    "/admin/:path*",
    "/login",
    // Public surfaces (with or without locale prefix).
    "/p/:path*",
    "/f/:path*", // CRAVADO Sub-etapa 22 V2 — fix dead matcher
    "/explore/:path*",
    "/shared/:path*",
    "/:locale/p/:path*",
    "/:locale/f/:path*", // CRAVADO Sub-etapa 22 V2
    "/:locale/explore/:path*",
    "/:locale/shared/:path*",
  ],
};
