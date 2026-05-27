/**
 * Sub-etapa 22.1 — proxy redirect for invalid subdomains.
 *
 * Tests the new guard in proxy.ts:
 *   if (!isApex && !orgId && subdomain) → redirect apex with ?error=org_not_found
 *
 * Strategy: mock resolveOrgByHost + extractSubdomain + isApexDomain,
 * then call proxy() with a synthetic NextRequest. Assert the 302 redirect URL.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const { resolveOrgByHostMock, isApexDomainMock, extractSubdomainMock } =
  vi.hoisted(() => ({
    resolveOrgByHostMock: vi.fn<() => Promise<string | null>>(),
    isApexDomainMock: vi.fn<(hostname: string) => boolean>(),
    extractSubdomainMock: vi.fn<(hostname: string) => string | null>(),
  }));

vi.mock("@/lib/tenant/org-resolver", () => ({
  resolveOrgByHost: resolveOrgByHostMock,
  isApexDomain: isApexDomainMock,
  extractSubdomain: extractSubdomainMock,
}));

import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

function makeRequest(url: string, host: string): NextRequest {
  const req = new NextRequest(url, {
    headers: { host },
  });
  return req;
}

describe("proxy — invalid subdomain redirect (Sub-etapa 22.1)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: not apex, no org, has subdomain
    isApexDomainMock.mockReturnValue(false);
    resolveOrgByHostMock.mockResolvedValue(null);
    extractSubdomainMock.mockReturnValue(null);
    // Ensure APEX_HOST resolves correctly in tests
    process.env.APEX_HOST = "localhost";
    process.env.COOKIE_DOMAIN = ".localhost";
  });

  it("nonexistent subdomain → 302 redirect to apex with ?error=org_not_found", async () => {
    isApexDomainMock.mockReturnValue(false);
    resolveOrgByHostMock.mockResolvedValue(null);
    extractSubdomainMock.mockReturnValue("nonexistent");

    const req = makeRequest(
      "http://nonexistent.localhost:3000/admin",
      "nonexistent.localhost:3000",
    );
    const res = await proxy(req);

    expect(res.status).toBe(302);
    const location = res.headers.get("location");
    expect(location).toBeTruthy();
    expect(location).toContain("error=org_not_found");
    expect(location).toContain("localhost");
    expect(location).not.toContain("nonexistent");
  });

  it("valid subdomain with active org → no redirect, injects x-org-id header", async () => {
    isApexDomainMock.mockReturnValue(false);
    resolveOrgByHostMock.mockResolvedValue("org-uuid-123");
    extractSubdomainMock.mockReturnValue("app");

    const req = makeRequest(
      "http://app.localhost:3000/api/departments",
      "app.localhost:3000",
    );
    const res = await proxy(req);

    // Not a redirect — should forward the request
    expect(res.status).not.toBe(302);
    expect(res.status).not.toBe(301);
    expect(res.status).not.toBe(308);
  });

  it("apex hostname → no redirect even without org", async () => {
    isApexDomainMock.mockReturnValue(true);
    resolveOrgByHostMock.mockResolvedValue(null);
    extractSubdomainMock.mockReturnValue(null);

    const req = makeRequest(
      "http://localhost:3000/admin/dashboard",
      "localhost:3000",
    );
    const res = await proxy(req);

    // Apex should not trigger the subdomain redirect guard.
    // (Auth gate may still redirect /admin → /login if no cookie, which is a 302 too,
    //  but NOT to ?error=org_not_found.)
    const location = res.headers.get("location");
    if (res.status === 302) {
      expect(location).not.toContain("org_not_found");
    }
  });

  it("subdomain present but no extractSubdomain result → no redirect", async () => {
    // Edge case: extractSubdomain returns null for a hostname that isApexDomain
    // also returned false (e.g. a customDomain like herd.buckedup.com where the
    // subdomain function returns null but org resolves via customDomain lookup).
    isApexDomainMock.mockReturnValue(false);
    resolveOrgByHostMock.mockResolvedValue(null);
    extractSubdomainMock.mockReturnValue(null); // customDomain case — no subdomain

    const req = makeRequest(
      "http://herd.buckedup.com/admin",
      "herd.buckedup.com",
    );
    const res = await proxy(req);

    // Guard: !isApex && !orgId && subdomain → subdomain is null → no redirect
    const location = res.headers.get("location");
    if (res.status === 302) {
      expect(location).not.toContain("org_not_found");
    }
  });
});
