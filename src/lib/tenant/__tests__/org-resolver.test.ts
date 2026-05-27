import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const { findUniqueMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: findUniqueMock,
    },
  },
}));

import {
  resolveOrgByHost,
  isApexDomain,
  extractSubdomain,
  _resetOrgResolverCache,
} from "../org-resolver";

// ── extractSubdomain ───────────────────────────────────────────────────────
describe("extractSubdomain", () => {
  it("DEV: app.localhost → 'app'", () => {
    expect(extractSubdomain("app.localhost")).toBe("app");
  });

  it("DEV: buckedup.comecaai.localhost → 'buckedup'", () => {
    expect(extractSubdomain("buckedup.comecaai.localhost")).toBe("buckedup");
  });

  it("DEV: localhost → null", () => {
    expect(extractSubdomain("localhost")).toBe(null);
  });

  it("DEV: comecaai.localhost → null (apex)", () => {
    expect(extractSubdomain("comecaai.localhost")).toBe(null);
  });

  it("PROD: app.comecaai.com.br → 'app'", () => {
    expect(extractSubdomain("app.comecaai.com.br")).toBe("app");
  });

  it("PROD: buckedup.comecaai.com.br → 'buckedup'", () => {
    expect(extractSubdomain("buckedup.comecaai.com.br")).toBe("buckedup");
  });

  it("PROD: comecaai.com.br → null (apex)", () => {
    expect(extractSubdomain("comecaai.com.br")).toBe(null);
  });

  it("CustomDomain: herd.buckedup.com → null (handled via customDomain lookup)", () => {
    expect(extractSubdomain("herd.buckedup.com")).toBe(null);
  });

  // Sub-etapa 22.1.1 — lvh.me DEV TLD
  it("DEV (lvh.me): app.lvh.me → 'app'", () => {
    expect(extractSubdomain("app.lvh.me")).toBe("app");
  });

  it("DEV (lvh.me): buckedup.lvh.me → 'buckedup'", () => {
    expect(extractSubdomain("buckedup.lvh.me")).toBe("buckedup");
  });

  it("DEV (lvh.me): lvh.me → null (apex)", () => {
    expect(extractSubdomain("lvh.me")).toBe(null);
  });
});

// ── isApexDomain ───────────────────────────────────────────────────────────
describe("isApexDomain", () => {
  it("localhost is apex", () => {
    expect(isApexDomain("localhost")).toBe(true);
  });

  it("comecaai.localhost is apex", () => {
    expect(isApexDomain("comecaai.localhost")).toBe(true);
  });

  it("comecaai.com.br is apex", () => {
    expect(isApexDomain("comecaai.com.br")).toBe(true);
  });

  it("www.comecaai.com.br is apex", () => {
    expect(isApexDomain("www.comecaai.com.br")).toBe(true);
  });

  it("app.comecaai.com.br is NOT apex", () => {
    expect(isApexDomain("app.comecaai.com.br")).toBe(false);
  });

  it("app.localhost is NOT apex", () => {
    expect(isApexDomain("app.localhost")).toBe(false);
  });

  it("herd.buckedup.com is NOT apex (customDomain)", () => {
    expect(isApexDomain("herd.buckedup.com")).toBe(false);
  });

  // Sub-etapa 22.1.1 — lvh.me DEV TLD
  it("lvh.me is apex (Sub-etapa 22.1.1)", () => {
    expect(isApexDomain("lvh.me")).toBe(true);
  });

  it("app.lvh.me is NOT apex (Sub-etapa 22.1.1)", () => {
    expect(isApexDomain("app.lvh.me")).toBe(false);
  });
});

// ── resolveOrgByHost ───────────────────────────────────────────────────────
describe("resolveOrgByHost", () => {
  beforeEach(() => {
    _resetOrgResolverCache();
    findUniqueMock.mockReset();
  });

  it("empty host returns null", async () => {
    expect(await resolveOrgByHost("")).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("apex domain returns null without DB call", async () => {
    expect(await resolveOrgByHost("comecaai.com.br")).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("localhost returns null without DB call", async () => {
    expect(await resolveOrgByHost("localhost")).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("lvh.me returns null without DB call (apex, Sub-etapa 22.1.1)", async () => {
    expect(await resolveOrgByHost("lvh.me")).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("strips port before lookup", async () => {
    findUniqueMock.mockResolvedValue({ id: "org-1", status: "ACTIVE" });
    await resolveOrgByHost("app.localhost:3000");
    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { customDomain: "app.localhost" } }),
    );
  });

  it("customDomain primary lookup (Cenário B2)", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "org-b2", status: "ACTIVE" });
    const result = await resolveOrgByHost("herd.buckedup.com");
    expect(result).toBe("org-b2");
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { customDomain: "herd.buckedup.com" },
      select: { id: true, status: true },
    });
  });

  it("subdomain fallback when customDomain misses (Cenário A)", async () => {
    findUniqueMock
      .mockResolvedValueOnce(null) // customDomain miss
      .mockResolvedValueOnce({ id: "org-a", status: "ACTIVE" }); // subdomain hit
    const result = await resolveOrgByHost("buckedup.comecaai.com.br");
    expect(result).toBe("org-a");
    expect(findUniqueMock).toHaveBeenCalledTimes(2);
    expect(findUniqueMock).toHaveBeenNthCalledWith(2, {
      where: { subdomain: "buckedup" },
      select: { id: true, status: true },
    });
  });

  it("SUSPENDED org returns null", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "org-s", status: "SUSPENDED" });
    expect(await resolveOrgByHost("susp.comecaai.com.br")).toBeNull();
  });

  it("unknown host (no org found) returns null", async () => {
    findUniqueMock.mockResolvedValue(null);
    expect(await resolveOrgByHost("nope.comecaai.com.br")).toBeNull();
  });

  it("cache hit skips second DB call within TTL", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "org-c", status: "ACTIVE" });
    const first = await resolveOrgByHost("herd.buckedup.com");
    const second = await resolveOrgByHost("herd.buckedup.com");
    expect(first).toBe("org-c");
    expect(second).toBe("org-c");
    // Only 1 DB call — second served from cache.
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
  });

  it("cache stores null result (unknown host) within TTL", async () => {
    findUniqueMock.mockResolvedValue(null);
    await resolveOrgByHost("nope.comecaai.com.br");
    await resolveOrgByHost("nope.comecaai.com.br");
    // First call: customDomain + subdomain = 2 DB hits. Second: 0 (cached).
    expect(findUniqueMock).toHaveBeenCalledTimes(2);
  });
});
