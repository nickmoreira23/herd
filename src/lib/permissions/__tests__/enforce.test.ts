import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock can() so we can control its verdict AND assert it never runs in `off`.
vi.mock("../can", () => ({ can: vi.fn() }));

import { enforce } from "../enforce";
import { can } from "../can";
import type { Actor, Permission } from "../types";

const mockedCan = vi.mocked(can);

const member: Actor = {
  profileId: "profile-member",
  isSuperAdmin: false,
  memberships: [],
};
const superAdmin: Actor = {
  profileId: "profile-super",
  isSuperAdmin: true,
  memberships: [],
};

const permission: Permission = {
  resource: "departments",
  action: "update",
  scopeType: "department",
  scopeId: "dept-1",
};

const ALLOW = { user: { id: "u1", activeOrgId: "org-1" } }; // requireOrgRole pass
const DENY = new Response("forbidden", { status: 403 }); // requireOrgRole deny

const ctx = <T>(current: T) => ({
  current,
  organizationId: "org-1",
  routeId: "POST /api/departments/[id]/members",
});

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  mockedCan.mockReset();
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  delete process.env.CAN_ENFORCEMENT;
});

describe("enforce() — off mode", () => {
  it("returns current unchanged, never runs can(), logs nothing", () => {
    delete process.env.CAN_ENFORCEMENT; // default off
    const result = enforce(member, permission, ctx(ALLOW));
    expect(result).toBe(ALLOW);
    expect(mockedCan).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("enforce() — shadow mode", () => {
  beforeEach(() => {
    process.env.CAN_ENFORCEMENT = "shadow";
  });

  it("can() agrees with requireOrgRole: returns current, logs agree:true", () => {
    mockedCan.mockReturnValue(true);
    const result = enforce(member, permission, ctx(ALLOW));
    expect(result).toBe(ALLOW);
    expect(mockedCan).toHaveBeenCalledTimes(1);
    const entry = warnSpy.mock.calls[0]![1] as Record<string, unknown>;
    expect(entry.agree).toBe(true);
    expect(entry.requireOrgRoleResult).toBe("allow");
    expect(entry.canResult).toBe(true);
  });

  it("can() disagrees: still returns current (never blocks), logs agree:false", () => {
    mockedCan.mockReturnValue(false);
    const result = enforce(member, permission, ctx(ALLOW));
    expect(result).toBe(ALLOW); // NOT a 403 — shadow never blocks
    const entry = warnSpy.mock.calls[0]![1] as Record<string, unknown>;
    expect(entry.agree).toBe(false);
    expect(entry.requireOrgRoleResult).toBe("allow");
    expect(entry.canResult).toBe(false);
  });

  it("super_admin: log marks actorKind super_admin", () => {
    mockedCan.mockReturnValue(true);
    enforce(superAdmin, permission, ctx(ALLOW));
    const entry = warnSpy.mock.calls[0]![1] as Record<string, unknown>;
    expect(entry.actorKind).toBe("super_admin");
    expect(entry.actorProfileId).toBe("profile-super");
  });
});

describe("enforce() — enforce mode", () => {
  beforeEach(() => {
    process.env.CAN_ENFORCEMENT = "enforce";
  });

  it("can() grants: proceeds (returns current)", () => {
    mockedCan.mockReturnValue(true);
    const result = enforce(member, permission, ctx(ALLOW));
    expect(result).toBe(ALLOW);
  });

  it("can() denies: blocks with 403", () => {
    mockedCan.mockReturnValue(false);
    const result = enforce(member, permission, ctx(ALLOW));
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
  });

  it("requireOrgRole already denied: returns that Response, never loosens", () => {
    mockedCan.mockReturnValue(true); // can would allow, but must NOT override
    const result = enforce(member, permission, ctx(DENY));
    expect(result).toBe(DENY);
    expect(mockedCan).not.toHaveBeenCalled(); // short-circuits on upstream deny
  });
});
