/**
 * Pure hostname utilities — no Prisma, edge-compatible.
 *
 * Extracted from org-resolver.ts so that proxy.ts (Next.js 16 "Proxy",
 * formerly Middleware) can import these without pulling Prisma into the
 * Edge bundle, which would cause OpenNext Cloudflare to reject the build.
 *
 * Tech debt: when org-resolver.ts is updated to use Cloudflare KV/D1 instead
 * of Prisma, this module can be merged back.
 */

const APEX_HOSTS = new Set([
  // DEV
  "localhost",
  "comecaai.localhost",
  "lvh.me", // Sub-etapa 22.1.1: wildcard DNS (*.lvh.me → 127.0.0.1)
  // PROD
  "comecaai.com.br",
  "www.comecaai.com.br",
]);

/**
 * Returns true when the hostname is an apex domain (no tenant context).
 */
export function isApexDomain(hostname: string): boolean {
  return APEX_HOSTS.has(hostname);
}

/**
 * Extract subdomain from hostname.
 *
 * DEV (localhost):
 *   app.localhost              → "app"
 *   buckedup.comecaai.localhost → "buckedup"
 *   localhost                  → null
 *   comecaai.localhost         → null (apex)
 *
 * DEV (lvh.me — Sub-etapa 22.1.1):
 *   app.lvh.me                 → "app"
 *   buckedup.lvh.me            → "buckedup"
 *   lvh.me                     → null (apex)
 *
 * PROD:
 *   app.comecaai.com.br        → "app"
 *   buckedup.comecaai.com.br   → "buckedup"
 *   comecaai.com.br            → null (apex)
 *
 * CustomDomain (herd.buckedup.com) → null (handled via customDomain lookup)
 */
export function extractSubdomain(hostname: string): string | null {
  // lvh.me DEV (Sub-etapa 22.1.1)
  // app.lvh.me → ["app", "lvh", "me"] → length 3 → "app"
  if (hostname.endsWith(".lvh.me")) {
    const parts = hostname.split(".");
    if (parts.length === 3) return parts[0];
    return null;
  }

  // Localhost DEV
  if (hostname.endsWith(".localhost")) {
    const parts = hostname.split(".");
    // comecaai.localhost is apex — no subdomain
    if (parts.length >= 2 && parts[0] !== "comecaai") {
      return parts[0];
    }
    return null;
  }

  // PROD
  if (hostname.endsWith(".comecaai.com.br")) {
    const parts = hostname.split(".");
    // app.comecaai.com.br = ['app', 'comecaai', 'com', 'br'] → length 4
    if (parts.length >= 4) return parts[0];
    return null;
  }

  return null;
}
