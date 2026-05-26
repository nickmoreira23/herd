import { describe, it, expect } from "vitest";
import { can } from "../can";
import type { Actor } from "../types";

describe("can()", () => {
  const orgA = "org-a-uuid";
  const orgB = "org-b-uuid";
  const deptSales = "dept-sales-uuid";

  it("super_admin always returns true", () => {
    const actor: Actor = {
      profileId: "p1",
      isSuperAdmin: true,
      memberships: [],
    };
    expect(can(actor, { resource: "org", action: "delete" }, orgA)).toBe(true);
    expect(can(actor, { resource: "integrations", action: "delete" }, orgB)).toBe(true);
  });

  it("OWNER has full org control", () => {
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
    expect(can(actor, { resource: "org", action: "delete" }, orgA)).toBe(true);
    expect(can(actor, { resource: "members", action: "invite" }, orgA)).toBe(true);
    expect(can(actor, { resource: "departments", action: "create" }, orgA)).toBe(true);
    expect(can(actor, { resource: "org_billing", action: "update" }, orgA)).toBe(true);
  });

  it("ADMIN cannot delete org or update billing", () => {
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
    expect(can(actor, { resource: "departments", action: "create" }, orgA)).toBe(true);
    expect(can(actor, { resource: "departments", action: "delete" }, orgA)).toBe(true);
    expect(can(actor, { resource: "org", action: "delete" }, orgA)).toBe(false);
    expect(can(actor, { resource: "org_billing", action: "update" }, orgA)).toBe(false);
  });

  it("MEMBER is read-only on departments/locations", () => {
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
    expect(can(actor, { resource: "departments", action: "read" }, orgA)).toBe(true);
    expect(can(actor, { resource: "locations", action: "read" }, orgA)).toBe(true);
    expect(can(actor, { resource: "departments", action: "create" }, orgA)).toBe(false);
    expect(can(actor, { resource: "locations", action: "delete" }, orgA)).toBe(false);
    expect(can(actor, { resource: "blocks_data", action: "create" }, orgA)).toBe(true);
    expect(can(actor, { resource: "blocks_data", action: "delete" }, orgA)).toBe(false);
  });

  it("access to orgB denied when member only of orgA", () => {
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
    expect(can(actor, { resource: "org", action: "read" }, orgB)).toBe(false);
    expect(can(actor, { resource: "departments", action: "delete" }, orgB)).toBe(false);
  });

  it("no membership at all returns false", () => {
    const actor: Actor = {
      profileId: "p1",
      isSuperAdmin: false,
      memberships: [],
    };
    expect(can(actor, { resource: "org", action: "read" }, orgA)).toBe(false);
  });

  it("DEPARTMENT_HEAD: invite allowed in own department, denied in other", () => {
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
      can(
        actor,
        { resource: "members", action: "invite", scopeType: "department", scopeId: deptSales },
        orgA
      )
    ).toBe(true);
    expect(
      can(
        actor,
        { resource: "members", action: "invite", scopeType: "department", scopeId: "other-dept" },
        orgA
      )
    ).toBe(false);
    // org-level invite (no scopeType) not granted
    expect(can(actor, { resource: "members", action: "invite" }, orgA)).toBe(false);
  });

  it("cumulative roles: union of permissions", () => {
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
    expect(can(actor, { resource: "departments", action: "read" }, orgA)).toBe(true);
    // DEPARTMENT_HEAD gives scoped invite
    expect(
      can(
        actor,
        { resource: "members", action: "invite", scopeType: "department", scopeId: deptSales },
        orgA
      )
    ).toBe(true);
    // Neither gives departments.create
    expect(can(actor, { resource: "departments", action: "create" }, orgA)).toBe(false);
  });

  it("DEPARTMENT_MANAGER: update allowed in own dept, not invite", () => {
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
      can(
        actor,
        { resource: "members", action: "update", scopeType: "department", scopeId: deptSales },
        orgA
      )
    ).toBe(true);
    expect(
      can(
        actor,
        { resource: "members", action: "invite", scopeType: "department", scopeId: deptSales },
        orgA
      )
    ).toBe(false);
  });
});
