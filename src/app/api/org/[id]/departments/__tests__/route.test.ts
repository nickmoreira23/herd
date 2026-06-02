import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/permissions", () => ({ requireOrgRole: vi.fn(), enforceRoute: vi.fn((_s, _p, ctx) => ctx.current) }));
vi.mock("@/lib/prisma", () => ({ prisma: { department: { findFirst: vi.fn(), create: vi.fn() } } }));
vi.mock("@/lib/audit/write-audit-log", () => ({ writeAuditLog: vi.fn() }));
vi.mock("@/lib/org-hierarchy", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/org-hierarchy")>();
  return { ...actual, withVerticalTenant: vi.fn() };
});

import { POST } from "../route";
import { requireOrgRole } from "@/lib/permissions";
import { withVerticalTenant, OrgVerticalForbiddenError } from "@/lib/org-hierarchy";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

const mockRequire = vi.mocked(requireOrgRole);
const mockVertical = vi.mocked(withVerticalTenant);
const mockAudit = vi.mocked(writeAuditLog);

const PARENT = "org-parent";
const CHILD = "org-child";
const session = (activeOrgId: string) => ({ user: { id: "u1", activeOrgId } }) as never;
const params = (id: string) => Promise.resolve({ id });
const req = (body: unknown) =>
  new Request("http://localhost/api/org/org-child/departments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockRequire.mockResolvedValue(session(PARENT));
});

describe("POST /api/org/[id]/departments (vertical write)", () => {
  it("#8 insufficient role: returns the requireOrgRole 403 Response", async () => {
    mockRequire.mockResolvedValue(new Response("forbidden", { status: 403 }));
    const res = await POST(req({ name: "X" }), { params: params(CHILD) });
    expect(res.status).toBe(403);
    expect(mockVertical).not.toHaveBeenCalled();
  });

  it("self target → 403 (use the normal route), never re-enters", async () => {
    const res = await POST(req({ name: "X" }), { params: params(PARENT) });
    expect(res.status).toBe(403);
    expect(mockVertical).not.toHaveBeenCalled();
  });

  it("OrgVerticalForbiddenError (non-descendant) → 403", async () => {
    mockVertical.mockRejectedValueOnce(new OrgVerticalForbiddenError("not a descendant"));
    const res = await POST(req({ name: "X" }), { params: params(CHILD) });
    expect(res.status).toBe(403);
  });

  it("authorized: re-enters child, creates, audits cross-tier with via_parent_org", async () => {
    mockVertical.mockImplementationOnce(async (_a, _c, fn) => fn());
    const { prisma } = await import("@/lib/prisma");
    // eslint-disable-next-line herd-tenancy/no-direct-prisma-on-scoped-models -- test mock handle, no real query
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce(null as never);
    // eslint-disable-next-line herd-tenancy/no-direct-prisma-on-scoped-models -- test mock handle, no real query
    vi.mocked(prisma.department.create).mockResolvedValueOnce({ id: "d1", name: "X", slug: "x" } as never);

    const res = await POST(req({ name: "X" }), { params: params(CHILD) });

    expect(res.status).toBe(201);
    expect(mockVertical).toHaveBeenCalledWith(PARENT, CHILD, expect.any(Function));
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: CHILD,
        actorProfileId: "u1",
        action: "department.created",
        metadata: expect.objectContaining({ via_parent_org: PARENT }),
      })
    );
  });
});
