import { prisma } from "@/lib/prisma";

type CacheEntry = { orgId: string | null; ts: number };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 30_000;

/**
 * Resolve org by host header.
 *
 * Lookup strategy:
 * 1. customDomain exact match (Cenário B2 — `herd.buckedup.com`).
 * 2. subdomain extraction match (Cenário A — `<slug>.comecaai.com.br`).
 * 3. null if no match.
 *
 * Cache TTL 30s in-memory. Tech debt: Edge KV for production scale.
 */
export async function resolveOrgByHost(host: string): Promise<string | null> {
  if (!host) return null;

  // Strip port
  const hostname = host.split(":")[0].toLowerCase();

  // Apex domain — no tenant context
  if (isApexDomain(hostname)) return null;

  // Check cache
  const cached = cache.get(hostname);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return cached.orgId;
  }

  // 1. customDomain lookup (Cenário B2)
  let org = await prisma.organization.findUnique({
    where: { customDomain: hostname },
    select: { id: true, status: true },
  });

  // 2. subdomain extraction (Cenário A)
  if (!org) {
    const subdomain = extractSubdomain(hostname);
    if (subdomain) {
      org = await prisma.organization.findUnique({
        where: { subdomain },
        select: { id: true, status: true },
      });
    }
  }

  // Only ACTIVE orgs resolve
  const orgId = org?.status === "ACTIVE" ? org.id : null;

  cache.set(hostname, { orgId, ts: Date.now() });
  return orgId;
}

/**
 * Apex domain detection.
 * DEV: localhost, comecaai.localhost.
 * PROD: comecaai.com.br, www.comecaai.com.br.
 */
export function isApexDomain(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "comecaai.localhost" ||
    hostname === "comecaai.com.br" ||
    hostname === "www.comecaai.com.br"
  );
}

/**
 * Extract subdomain from hostname.
 *
 * DEV:
 *   app.localhost              → "app"
 *   buckedup.comecaai.localhost → "buckedup"
 *   localhost                  → null
 *   comecaai.localhost         → null (apex)
 *
 * PROD:
 *   app.comecaai.com.br        → "app"
 *   buckedup.comecaai.com.br   → "buckedup"
 *   comecaai.com.br            → null (apex)
 *
 * CustomDomain (herd.buckedup.com) → null (handled via customDomain lookup)
 */
export function extractSubdomain(hostname: string): string | null {
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

/**
 * Reset cache — testing only.
 */
export function _resetOrgResolverCache() {
  cache.clear();
}
