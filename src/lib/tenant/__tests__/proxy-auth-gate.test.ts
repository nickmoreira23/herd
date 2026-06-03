/**
 * SE-PERM Peça 1 — proxy auth-gate validation (AUTH_GATE_MODE off|shadow|enforce).
 *
 * Strategy: mock org-resolver (no DB) so no subdomain redirect interferes, mock
 * `next-auth/jwt` decode to control valid/invalid/expired, and drive proxy() with
 * synthetic NextRequests carrying (or omitting) a session cookie. AUTH_GATE_MODE
 * is set per test via process.env. No real secret/token/network.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { resolveOrgByHostMock, isApexDomainMock, extractSubdomainMock, decodeMock } =
  vi.hoisted(() => ({
    resolveOrgByHostMock: vi.fn<() => Promise<string | null>>(),
    isApexDomainMock: vi.fn<(hostname: string) => boolean>(),
    extractSubdomainMock: vi.fn<(hostname: string) => string | null>(),
    decodeMock: vi.fn(),
  }));

vi.mock("@/lib/tenant/org-resolver", () => ({
  resolveOrgByHost: resolveOrgByHostMock,
  isApexDomain: isApexDomainMock,
  extractSubdomain: extractSubdomainMock,
}));

vi.mock("next-auth/jwt", () => ({ decode: decodeMock }));

import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

function makeRequest(url: string, host: string, cookie?: string): NextRequest {
  const headers: Record<string, string> = { host };
  if (cookie) headers.cookie = cookie;
  return new NextRequest(url, { headers });
}

const DEV_COOKIE = "authjs.session-token";
const ORIG_MODE = process.env.AUTH_GATE_MODE;

describe("proxy auth-gate — AUTH_GATE_MODE", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Apex, no subdomain → never trips the subdomain-redirect guard.
    isApexDomainMock.mockReturnValue(true);
    resolveOrgByHostMock.mockResolvedValue(null);
    extractSubdomainMock.mockReturnValue(null);
    process.env.APEX_HOST = "lvh.me";
  });

  afterEach(() => {
    if (ORIG_MODE === undefined) delete process.env.AUTH_GATE_MODE;
    else process.env.AUTH_GATE_MODE = ORIG_MODE;
  });

  // ── Characterization: current behavior (off / default) ───────────────────
  it("off: gated /api with ANY cookie → passes (presence-only, decode not called)", async () => {
    process.env.AUTH_GATE_MODE = "off";
    const req = makeRequest("http://lvh.me:3000/api/departments", "lvh.me:3000", `${DEV_COOKIE}=garbage`);
    const res = await proxy(req);
    expect(res.status).not.toBe(401);
    expect(decodeMock).not.toHaveBeenCalled();
  });

  it("off: gated /api with NO cookie → 401", async () => {
    process.env.AUTH_GATE_MODE = "off";
    const req = makeRequest("http://lvh.me:3000/api/departments", "lvh.me:3000");
    const res = await proxy(req);
    expect(res.status).toBe(401);
  });

  it("default (unset) behaves as off", async () => {
    delete process.env.AUTH_GATE_MODE;
    const req = makeRequest("http://lvh.me:3000/api/departments", "lvh.me:3000", `${DEV_COOKIE}=garbage`);
    const res = await proxy(req);
    expect(res.status).not.toBe(401);
    expect(decodeMock).not.toHaveBeenCalled();
  });

  // ── enforce: invalid = not-logged ────────────────────────────────────────
  it("enforce: valid token on /api → passes", async () => {
    process.env.AUTH_GATE_MODE = "enforce";
    decodeMock.mockResolvedValue({ sub: "user-1" });
    const req = makeRequest("http://lvh.me:3000/api/departments", "lvh.me:3000", `${DEV_COOKIE}=valid`);
    const res = await proxy(req);
    expect(res.status).not.toBe(401);
    expect(decodeMock).toHaveBeenCalledWith(
      expect.objectContaining({ token: "valid", salt: DEV_COOKIE }),
    );
  });

  it("enforce: forged/garbage token on /api → 401", async () => {
    process.env.AUTH_GATE_MODE = "enforce";
    decodeMock.mockRejectedValue(new Error("decryption failed"));
    const req = makeRequest("http://lvh.me:3000/api/departments", "lvh.me:3000", `${DEV_COOKIE}=garbage`);
    const res = await proxy(req);
    expect(res.status).toBe(401);
  });

  it("enforce: expired token on /api → 401", async () => {
    process.env.AUTH_GATE_MODE = "enforce";
    const expired = Object.assign(new Error("\"exp\" claim timestamp check failed"), { code: "ERR_JWT_EXPIRED" });
    decodeMock.mockRejectedValue(expired);
    const req = makeRequest("http://lvh.me:3000/api/departments", "lvh.me:3000", `${DEV_COOKIE}=expired`);
    const res = await proxy(req);
    expect(res.status).toBe(401);
  });

  it("enforce: invalid token on /admin → redirect /login (same as missing)", async () => {
    process.env.AUTH_GATE_MODE = "enforce";
    decodeMock.mockResolvedValue(null);
    const req = makeRequest("http://lvh.me:3000/admin", "lvh.me:3000", `${DEV_COOKIE}=garbage`);
    const res = await proxy(req);
    expect(res.status).toBe(307); // NextResponse.redirect default for /login
    expect(res.headers.get("location")).toContain("/login");
  });

  // ── shadow: never blocks; logs would-block ───────────────────────────────
  it("shadow: forged token on /api → passes (NOT blocked) and logs would-block", async () => {
    process.env.AUTH_GATE_MODE = "shadow";
    decodeMock.mockRejectedValue(new Error("decryption failed"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const req = makeRequest("http://lvh.me:3000/api/departments", "lvh.me:3000", `${DEV_COOKIE}=garbage`);
    const res = await proxy(req);
    expect(res.status).not.toBe(401);
    expect(warn).toHaveBeenCalledWith(
      "[auth-gate]",
      expect.stringContaining('"mode":"shadow"'),
    );
    expect(warn.mock.calls[0][1]).toContain('"reason":"decode_failed"');
    expect(warn.mock.calls[0][1]).not.toContain("garbage"); // no token in log
    warn.mockRestore();
  });

  it("shadow: valid token on /api → passes, no would-block log", async () => {
    process.env.AUTH_GATE_MODE = "shadow";
    decodeMock.mockResolvedValue({ sub: "user-1" });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const req = makeRequest("http://lvh.me:3000/api/departments", "lvh.me:3000", `${DEV_COOKIE}=valid`);
    const res = await proxy(req);
    expect(res.status).not.toBe(401);
    expect(warn).not.toHaveBeenCalledWith("[auth-gate]", expect.anything());
    warn.mockRestore();
  });

  // ── Allowlist preserved in every mode ────────────────────────────────────
  it("public /api/health → passes in enforce even with no/forged cookie", async () => {
    process.env.AUTH_GATE_MODE = "enforce";
    decodeMock.mockRejectedValue(new Error("decryption failed"));
    const req = makeRequest("http://lvh.me:3000/api/health", "lvh.me:3000", `${DEV_COOKIE}=garbage`);
    const res = await proxy(req);
    expect(res.status).not.toBe(401);
  });

  it("public /api/health with NO cookie → passes in enforce", async () => {
    process.env.AUTH_GATE_MODE = "enforce";
    const req = makeRequest("http://lvh.me:3000/api/health", "lvh.me:3000");
    const res = await proxy(req);
    expect(res.status).not.toBe(401);
  });
});
