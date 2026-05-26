import { headers } from "next/headers";

/**
 * Lê x-org-id injetado pelo proxy.
 * Usado em route handlers + server actions pra resolver tenant atual.
 * Returns null on apex domains or unresolved hosts.
 */
export async function getOrgIdFromRequest(): Promise<string | null> {
  const h = await headers();
  return h.get("x-org-id") ?? null;
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
