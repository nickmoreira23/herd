import { headers } from "next/headers";
import { resolveOrgByHost } from "./org-resolver";

/**
 * Resolves the effective org ID for the current request.
 *
 * Resolution order (Sub-etapa 22 V2 + Workers-compat refactor):
 * 1. x-org-id header — set by proxy.ts when running in Node.js context
 *    (legacy path, kept for backward compatibility).
 * 2. x-host header — proxy always injects this (edge-compatible); used to
 *    call resolveOrgByHost() in the Node.js route handler context so that
 *    tenant lookup still works when the proxy cannot do the DB call itself
 *    (e.g., Cloudflare Workers where proxy.ts is edge-compiled).
 * 3. null — apex domain or no host available.
 *
 * Route handlers continue to pass this to requireOrgRole / withTenant.
 * The JWT activeOrgId fallback lives in requireOrgRole (not here).
 */
export async function getOrgIdFromRequest(): Promise<string | null> {
  const h = await headers();

  // Primary: proxy injected x-org-id directly (Node.js standalone path)
  const injectedOrgId = h.get("x-org-id");
  if (injectedOrgId) return injectedOrgId;

  // Fallback: resolve from x-host in Node.js route handler context.
  // proxy.ts always sets x-host (edge-compatible), so this covers Workers
  // deployments where the proxy cannot reach Prisma.
  const host = h.get("x-host") ?? "";
  if (host) return resolveOrgByHost(host);

  return null;
}

/**
 * Returns true when the current request is on an apex domain.
 * The proxy sets x-is-apex to "true" for apex requests.
 */
export async function isApexRequest(): Promise<boolean> {
  const h = await headers();
  return h.get("x-is-apex") === "true";
}

/**
 * Returns the hostname (without port) forwarded by the proxy via x-host.
 */
export async function getHostFromRequest(): Promise<string | null> {
  const h = await headers();
  return h.get("x-host") ?? null;
}
