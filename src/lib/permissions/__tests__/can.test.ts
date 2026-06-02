import { describe, it, expect, vi } from "vitest";
import { ROLE_PERMISSIONS } from "../role-permissions";

// can() now reads the matrix from the DB via loadRoleMatrix() (V3.2). Mock the
// loader to return the hardcoded constant so these stay UNIT tests (no DB) and
// verify the exact same decision logic against the exact same matrix.
vi.mock("../role-matrix-loader", () => ({
  loadRoleMatrix: vi.fn(async () => ROLE_PERMISSIONS),
}));

import { can } from "../can";
import type { Actor } from "../types";

describe("can()", () => {
  const orgA = "org-a-uuid";
  const orgB = "org-b-uuid";
  const deptSales = "dept-sales-uuid";

  it("super_admin always returns true", async () => {
    const actor: Actor = {
      profileId: "p1",
      isSuperAdmin: true,
      memberships: [],
    };
    expect(await can(actor, { resource: "org", action: "delete" }, orgA)).toBe(true);
    expect(await can(actor, { resource: "integrations", action: "delete" }, orgB)).toBe(true);
  });

  it("OWNER has full org control", async () => {
    const actor: Actor = {
      profileId: "p1",
      isSuperAdmin: false,
      memberships: [
        {
          organizationId: orgA,
          status: "ACTIVE",
          roles: [{ role: "OWNER", scopeType: "ORG", scopeId: null }],
        },
      ],
    };
    expect(await can(actor, { resource: "org", action: "delete" }, orgA)).toBe(true);
    expect(await can(actor, { resource: "members", action: "invite" }, orgA)).toBe(true);
    expect(await can(actor, { resource: "departments", action: "create" }, orgA)).toBe(true);
    expect(await can(actor, { resource: "org_billing", action: "update" }, orgA)).toBe(true);
  });

  it("ADMIN cannot delete org or update billing", async () => {
    const actor: Actor = {
      profileId: "p1",
      isSuperAdmin: false,
      memberships: [
        {
          organizationId: orgA,
          status: "ACTIVE",
          roles: [{ role: "ADMIN", scopeType: "ORG", scopeId: null }],
        },
      ],
    };
    expect(await can(actor, { resource: "departments", action: "create" }, orgA)).toBe(true);
    expect(await can(actor, { resource: "departments", action: "delete" }, orgA)).toBe(true);
    expect(await can(actor, { resource: "org", action: "delete" }, orgA)).toBe(false);
    expect(await can(actor, { resource: "org_billing", action: "update" }, orgA)).toBe(false);
  });

  it("MEMBER is read-only on departments/locations", async () => {
    const actor: Actor = {
      profileId: "p1",
      isSuperAdmin: false,
      memberships: [
        {
          organizationId: orgA,
          status: "ACTIVE",
          roles: [{ role: "MEMBER", scopeType: "ORG", scopeId: null }],
        },
      ],
    };
    expect(await can(actor, { resource: "departments", action: "read" }, orgA)).toBe(true);
    expect(await can(actor, { resource: "locations", action: "read" }, orgA)).toBe(true);
    expect(await can(actor, { resource: "departments", action: "create" }, orgA)).toBe(false);
    expect(await can(actor, { resource: "locations", action: "delete" }, orgA)).toBe(false);
    expect(await can(actor, { resource: "blocks_data", action: "create" }, orgA)).toBe(true);
    expect(await can(actor, { resource: "blocks_data", action: "delete" }, orgA)).toBe(false);
  });

  it("access to orgB denied when member only of orgA", async () => {
    const actor: Actor = {
      profileId: "p1",
      isSuperAdmin: false,
      memberships: [
        {
          organizationId: orgA,
          status: "ACTIVE",
          roles: [{ role: "OWNER", scopeType: "ORG", scopeId: null }],
        },
      ],
    };
    expect(await can(actor, { resource: "org", action: "read" }, orgB)).toBe(false);
    expect(await can(actor, { resource: "departments", action: "delete" }, orgB)).toBe(false);
  });

  it("no membership at all returns false", async () => {
    const actor: Actor = {
      profileId: "p1",
      isSuperAdmin: false,
      memberships: [],
    };
    expect(await can(actor, { resource: "org", action: "read" }, orgA)).toBe(false);
  });

  it("DEPARTMENT_HEAD: invite allowed in own department, denied in other", async () => {
    const actor: Actor = {
      profileId: "p1",
      isSuperAdmin: false,
      memberships: [
        {
          organizationId: orgA,
          status: "ACTIVE",
          roles: [
            { role: "DEPARTMENT_HEAD", scopeType: "DEPARTMENT", scopeId: deptSales },
          ],
        },
      ],
    };
    expect(
      await can(
        actor,
        { resource: "members", action: "invite", scopeType: "department", scopeId: deptSales },
        orgA
      )
    ).toBe(true);
    expect(
      await can(
        actor,
        { resource: "members", action: "invite", scopeType: "department", scopeId: "other-dept" },
        orgA
      )
    ).toBe(false);
    // org-level invite (no scopeType) not granted
    expect(await can(actor, { resource: "members", action: "invite" }, orgA)).toBe(false);
  });

  it("cumulative roles: union of permissions", async () => {
    const actor: Actor = {
      profileId: "p1",
      isSuperAdmin: false,
      memberships: [
        {
          organizationId: orgA,
          status: "ACTIVE",
          roles: [
            { role: "MEMBER", scopeType: "ORG", scopeId: null },
            { role: "DEPARTMENT_HEAD", scopeType: "DEPARTMENT", scopeId: deptSales },
          ],
        },
      ],
    };
    // MEMBER gives read
    expect(await can(actor, { resource: "departments", action: "read" }, orgA)).toBe(true);
    // DEPARTMENT_HEAD gives scoped invite
    expect(
      await can(
        actor,
        { resource: "members", action: "invite", scopeType: "department", scopeId: deptSales },
        orgA
      )
    ).toBe(true);
    // Neither gives departments.create
    expect(await can(actor, { resource: "departments", action: "create" }, orgA)).toBe(false);
  });

  it("DEPARTMENT_MANAGER: update allowed in own dept, not invite", async () => {
    const actor: Actor = {
      profileId: "p1",
      isSuperAdmin: false,
      memberships: [
        {
          organizationId: orgA,
          status: "ACTIVE",
          roles: [
            { role: "DEPARTMENT_MANAGER", scopeType: "DEPARTMENT", scopeId: deptSales },
          ],
        },
      ],
    };
    expect(
      await can(
        actor,
        { resource: "members", action: "update", scopeType: "department", scopeId: deptSales },
        orgA
      )
    ).toBe(true);
    expect(
      await can(
        actor,
        { resource: "members", action: "invite", scopeType: "department", scopeId: deptSales },
        orgA
      )
    ).toBe(false);
  });
});
