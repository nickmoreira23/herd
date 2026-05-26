/**
 * Integration tests — Admin integration route auth gates.
 *
 * Covers [id]/test, [id]/sync, [id]/logs, and [id]/mappings.
 * Each route must:
 *   - Return 401 when there is no session.
 *   - Return 403 when the session role is not super_admin.
 *
 * 200 paths are not tested here because they require a real DB row and
 * live credentials. The withTenant scoping is validated separately in
 * src/lib/tenancy/__tests__/isolation.integration.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Session } from "next-auth";

// ── Mock @/lib/auth before importing the routes ──────────────────────────────
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// ── Mock @/lib/prisma so no DB connection is required ────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    networkProfile: { findUnique: vi.fn().mockResolvedValue({ isSuperAdmin: false }) },
    integration: { findUnique: vi.fn() },
    integrationSyncLog: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    integrationTierMapping: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
  },
}));

// ── Import routes AFTER mocks are set up ─────────────────────────────────────
const { auth } = await import("@/lib/auth");

const { POST: testPOST } = await import("../[id]/test/route");
const { POST: syncPOST } = await import("../[id]/sync/route");
const { GET: logsGET } = await import("../[id]/logs/route");
const { GET: mappingsGET, POST: mappingsPOST, DELETE: mappingsDELETE } = await import(
  "../[id]/mappings/route"
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockParams = (id = "test-integration-id") =>
  ({ params: Promise.resolve({ id }) } as { params: Promise<{ id: string }> });

const makeRequest = (method = "POST", body?: object) =>
  new Request("http://localhost/api/integrations/test-id", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

const superAdminSession: Session = {
  user: { id: "user-1", role: "super_admin", activeOrgId: "org-1" },
  expires: new Date(Date.now() + 3600 * 1000).toISOString(),
};

const memberSession: Session = {
  user: { id: "user-2", role: "member", activeOrgId: "org-1" },
  expires: new Date(Date.now() + 3600 * 1000).toISOString(),
};

// ── Test suites ───────────────────────────────────────────────────────────────

describe("[id]/test route — POST", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await testPOST(makeRequest(), mockParams());
    expect(res.status).toBe(401);
  });

  it("returns 403 when session role is not super_admin", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue(memberSession as any);
    const res = await testPOST(makeRequest(), mockParams());
    expect(res.status).toBe(403);
  });
});

describe("[id]/sync route — POST", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await syncPOST(makeRequest(), mockParams());
    expect(res.status).toBe(401);
  });

  it("returns 403 when session role is not super_admin", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue(memberSession as any);
    const res = await syncPOST(makeRequest(), mockParams());
    expect(res.status).toBe(403);
  });
});

describe("[id]/logs route — GET", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await logsGET(makeRequest("GET"), mockParams());
    expect(res.status).toBe(401);
  });

  it("returns 403 when session role is not super_admin", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue(memberSession as any);
    const res = await logsGET(makeRequest("GET"), mockParams());
    expect(res.status).toBe(403);
  });
});

describe("[id]/mappings route — GET", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await mappingsGET(makeRequest("GET"), mockParams());
    expect(res.status).toBe(401);
  });

  it("returns 403 when session role is not super_admin", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue(memberSession as any);
    const res = await mappingsGET(makeRequest("GET"), mockParams());
    expect(res.status).toBe(403);
  });
});

describe("[id]/mappings route — POST", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await mappingsPOST(makeRequest("POST", {}), mockParams());
    expect(res.status).toBe(401);
  });

  it("returns 403 when session role is not super_admin", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue(memberSession as any);
    const res = await mappingsPOST(makeRequest("POST", {}), mockParams());
    expect(res.status).toBe(403);
  });
});

describe("[id]/mappings route — DELETE", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await mappingsDELETE(
      makeRequest("DELETE", { mappingId: "map-1" }),
      mockParams()
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when session role is not super_admin", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue(memberSession as any);
    const res = await mappingsDELETE(
      makeRequest("DELETE", { mappingId: "map-1" }),
      mockParams()
    );
    expect(res.status).toBe(403);
  });
});
