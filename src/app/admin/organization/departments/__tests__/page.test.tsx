import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/tenant/get-org-from-request", () => ({ getOrgIdFromRequest: vi.fn() }));
vi.mock("@/lib/tenancy/context", () => ({
  // Execute fn so prisma mocks are reached, and record the orgId it was scoped to.
  withTenant: vi.fn((_orgId: string, fn: () => unknown) => fn()),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    department: { findMany: vi.fn(), findUnique: vi.fn() },
    networkProfile: { findMany: vi.fn() },
  },
}));
vi.mock("@/components/organization/department-tree", () => ({
  DepartmentTree: (props: unknown) => props,
}));
vi.mock("@/components/organization/department-detail", () => ({
  DepartmentDetail: (props: unknown) => props,
}));

import DepartmentsPage from "../page";
import DepartmentDetailPage from "../[id]/page";
import { auth } from "@/lib/auth";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

const mockAuth = vi.mocked(auth);
const mockGetOrg = vi.mocked(getOrgIdFromRequest);
const mockWithTenant = vi.mocked(withTenant);
// eslint-disable-next-line herd-tenancy/no-direct-prisma-on-scoped-models -- test mock handle, no real query runs
const mockDeptFindMany = vi.mocked(prisma.department.findMany);
// eslint-disable-next-line herd-tenancy/no-direct-prisma-on-scoped-models -- test mock handle, no real query runs
const mockDeptFindUnique = vi.mocked(prisma.department.findUnique);
const mockProfiles = vi.mocked(prisma.networkProfile.findMany);

beforeEach(() => {
  vi.clearAllMocks();
  mockDeptFindMany.mockResolvedValue([] as never);
  mockDeptFindUnique.mockResolvedValue({ id: "d1" } as never);
  mockProfiles.mockResolvedValue([] as never);
});

describe("DepartmentsPage (list) — tenant scoping", () => {
  it("scopes reads with withTenant(activeOrgId) from the host header", async () => {
    mockGetOrg.mockResolvedValue("org-host");
    mockAuth.mockResolvedValue({ user: { activeOrgId: "org-jwt" } } as never);

    await DepartmentsPage();

    expect(mockWithTenant).toHaveBeenCalledOnce();
    expect(mockWithTenant.mock.calls[0][0]).toBe("org-host"); // host wins over JWT
    expect(mockDeptFindMany).toHaveBeenCalledOnce();
  });

  it("falls back to JWT activeOrgId when no host header", async () => {
    mockGetOrg.mockResolvedValue(null);
    mockAuth.mockResolvedValue({ user: { activeOrgId: "org-jwt" } } as never);
    await DepartmentsPage();
    expect(mockWithTenant.mock.calls[0][0]).toBe("org-jwt");
  });

  it("GUARD: no active org → never calls withTenant, never reads", async () => {
    mockGetOrg.mockResolvedValue(null);
    mockAuth.mockResolvedValue({ user: {} } as never);

    await DepartmentsPage();

    expect(mockWithTenant).not.toHaveBeenCalled();
    expect(mockDeptFindMany).not.toHaveBeenCalled();
  });
});

describe("DepartmentDetailPage — tenant scoping", () => {
  const params = Promise.resolve({ id: "d1" });

  it("scopes findUnique with withTenant(orgId)", async () => {
    mockGetOrg.mockResolvedValue("org-host");
    mockAuth.mockResolvedValue({ user: { activeOrgId: "org-jwt" } } as never);

    await DepartmentDetailPage({ params });

    expect(mockWithTenant).toHaveBeenCalled();
    expect(mockWithTenant.mock.calls[0][0]).toBe("org-host");
    expect(mockDeptFindUnique).toHaveBeenCalledOnce();
  });

  it("GUARD: no active org → notFound, never withTenant", async () => {
    mockGetOrg.mockResolvedValue(null);
    mockAuth.mockResolvedValue({ user: {} } as never);

    await expect(DepartmentDetailPage({ params: Promise.resolve({ id: "d1" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(notFound).toHaveBeenCalled();
    expect(mockWithTenant).not.toHaveBeenCalled();
  });
});
