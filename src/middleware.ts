import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isSupportedLocale,
  normalizeLocale,
  DEFAULT_LOCALE,
} from "@/lib/i18n/locales";

// Surfaces públicas que devem ter prefixo de locale na URL.
// Admin/api/auth ficam flat (cookie resolve).
const PUBLIC_LOCALE_PREFIXES = ["/p", "/f", "/explore", "/shared"];

function isPublicLocaleRoute(pathname: string): boolean {
  return PUBLIC_LOCALE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

function extractLocaleFromPath(pathname: string): { locale: string; rest: string } | null {
  const match = pathname.match(/^\/([a-z]{2}-[A-Z]{2})(\/.*)?$/);
  if (!match) return null;
  return { locale: match[1], rest: match[2] ?? "/" };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ───────────────────────────────────────────────────────────
  // Auth gate (preserved from before): protect /admin, redirect login.
  // ───────────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────────
  // Public route locale handling — only for the 4 public surfaces.
  // Admin/api/auth/internal pass through without locale rewriting.
  // ───────────────────────────────────────────────────────────
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
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    const localeOverride = request.nextUrl.searchParams.get("locale");
    if (localeOverride) requestHeaders.set("x-locale-override", localeOverride);

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

  // ───────────────────────────────────────────────────────────
  // Default path (admin, api, login, etc.): forward x-pathname and
  // x-locale-override headers as before.
  // ───────────────────────────────────────────────────────────
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const localeOverride = request.nextUrl.searchParams.get("locale");
  if (localeOverride) requestHeaders.set("x-locale-override", localeOverride);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    // Public surfaces (with or without locale prefix).
    "/p/:path*",
    "/explore/:path*",
    "/shared/:path*",
    "/:locale/p/:path*",
    "/:locale/explore/:path*",
    "/:locale/shared/:path*",
  ],
};
