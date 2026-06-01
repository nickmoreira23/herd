import { NextRequest, NextResponse } from "next/server";
import {
  isSupportedLocale,
  normalizeLocale,
  DEFAULT_LOCALE,
} from "@/lib/i18n/locales";
import {
  resolveOrgByHost,
  isApexDomain,
  extractSubdomain,
} from "@/lib/tenant/org-resolver";

// Surfaces públicas que devem ter prefixo de locale na URL.
// Admin/api/auth ficam flat (cookie resolve).
const PUBLIC_LOCALE_PREFIXES = ["/p", "/f", "/explore", "/shared"];

function isPublicLocaleRoute(pathname: string): boolean {
  return PUBLIC_LOCALE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

// /api routes reachable WITHOUT a session, by necessity. Default-deny: every
// other /api route requires a logged-in session (see the gate in proxy()).
// Each entry is justified — webhooks self-verify signatures, cron self-checks
// CRON_SECRET, OAuth/token routes carry their own credential in the URL.
const PUBLIC_API_MATCHERS: RegExp[] = [
  /^\/api\/auth\//, // NextAuth (login flow, session, csrf)
  /^\/api\/health$/, // uptime/monitor
  /^\/api\/analytics\/web-vitals$/, // telemetry beacon
  /^\/api\/cron\//, // self-protected by CRON_SECRET
  /^\/api\/webhooks\//, // braintree/intercom/recharge/gorgias — signature-verified
  /^\/api\/integrations\/recall\/webhook$/, // svix-verified
  /^\/api\/apps\/terra\/webhook$/, // signature-verified
  /^\/api\/knowledge\/apps\/terra\/webhook$/, // signature-verified
  /^\/api\/messages\/webhook\/[^/]+$/, // per-channel webhook
  /^\/api\/integrations\/oauth\/(authorize|callback)$/, // OAuth redirects
  /^\/api\/apps\/callback\/[^/]+$/, // OAuth app callback
  /^\/api\/knowledge\/apps\/callback\/[^/]+$/, // OAuth app callback
  /^\/api\/shared\/[^/]+$/, // token-based public share
  /^\/api\/org\/invitations\/[^/]+$/, // view invitation by token (invitee not yet a member)
  /^\/api\/org\/invitations\/[^/]+\/accept$/, // accept invitation by token
];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_MATCHERS.some((re) => re.test(pathname));
}

function extractLocaleFromPath(
  pathname: string,
): { locale: string; rest: string } | null {
  const match = pathname.match(/^\/([a-z]{2}-[A-Z]{2})(\/.*)?$/);
  if (!match) return null;
  return { locale: match[1], rest: match[2] ?? "/" };
}

// COOKIE_DOMAIN env var (Sub-etapa 22.1): leading dot enables sharing across
// subdomains (e.g. .localhost or .comecaai.com.br). Undefined = browser default
// (per-hostname isolation). Set in .env for DEV, Railway env vars for PROD.
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN ?? undefined;

// APEX_HOST env var (Sub-etapa 22.1): destination when an invalid subdomain is
// detected (no active org found). DEV: localhost. PROD: comecaai.com.br.
const APEX_HOST = process.env.APEX_HOST ?? "localhost";

/**
 * CRAVADO Sub-etapa 22 V2:
 * - Node runtime (via proxy.ts) — Prisma/pg compatible.
 * - Resolves tenant via host header.
 * - Injects x-org-id, x-host, x-is-apex headers.
 * - Preserves auth gate + locale handling from the former middleware.ts.
 *
 * CRAVADO Sub-etapa 22.1:
 * - Redirect invalid subdomain (no active org) → apex with ?error=org_not_found.
 * - Locale cookie sets COOKIE_DOMAIN for cross-subdomain persistence.
 *
 * Does NOT include:
 * - Apex auto-redirect / org selector → Sub-etapa 22.2.
 */
export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0].toLowerCase();
  const { pathname } = request.nextUrl;

  // ─── 1. Tenant resolution ────────────────────────────────────────────
  // try/catch: a DB error here (e.g. schema drift, transient blip) must NOT
  // crash the proxy and 500 the entire surface. Degrade to org=null; the /api
  // auth gate below is session-only (DB-independent) and stays effective.
  let orgId: string | null = null;
  let resolveFailed = false;
  try {
    orgId = await resolveOrgByHost(host);
  } catch (err) {
    console.error("[proxy] resolveOrgByHost failed; degrading to org=null:", err);
    resolveFailed = true;
  }
  const isApex = isApexDomain(hostname);

  // ─── 1a. Invalid subdomain redirect (Sub-etapa 22.1) ─────────────────
  // If the hostname has a subdomain (not apex) but resolves to no active org,
  // redirect to the apex with an error query param so the apex can surface a
  // user-facing message. The UI banner for ?error=org_not_found is Sub-etapa 22.2.
  // !resolveFailed: on a DB error we must NOT bounce a (possibly valid)
  // subdomain to the apex error page — only redirect when resolution genuinely
  // succeeded and found no active org.
  if (!isApex && !orgId && !resolveFailed) {
    const subdomain = extractSubdomain(hostname);
    if (subdomain) {
      const apexUrl = request.nextUrl.clone();
      apexUrl.hostname = APEX_HOST;
      apexUrl.pathname = "/";
      apexUrl.search = "?error=org_not_found";
      return NextResponse.redirect(apexUrl, 302);
    }
  }

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

  if (
    (pathname.startsWith("/admin") || pathname.startsWith("/orgs")) &&
    !isLoggedIn
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // ─── 2b. API auth gate (default-deny) ────────────────────────────────
  // Session-only (no DB) so it stays effective even when tenant resolution
  // degrades. Blocks anonymous access to every /api route except the
  // explicit public allowlist (webhooks, cron, OAuth, token, telemetry, health).
  // NOTE: this closes anonymous exposure only; cross-tenant scoping between
  // logged-in users is a separate per-handler layer (not this change).
  if (
    pathname.startsWith("/api/") &&
    !isLoggedIn &&
    !isPublicApiRoute(pathname)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      // Sub-etapa 22.1: locale cookie uses COOKIE_DOMAIN for cross-subdomain sharing.
      res.cookies.set("locale", extracted.locale, {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        sameSite: "lax",
        httpOnly: false,
        domain: COOKIE_DOMAIN,
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
    "/orgs",
    "/orgs/:path*",
    // Public surfaces (with or without locale prefix).
    "/accept/:path*",
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
