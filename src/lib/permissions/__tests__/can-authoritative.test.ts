import { describe, it, expect, vi } from "vitest";
import { ROLE_PERMISSIONS } from "../role-permissions";

// Authoritative-can() oracle (R&P Fase 4a). The matrix is the 97 system grants
// (ROLE_PERMISSIONS); mock the loader so this is a pure UNIT test. The oracle is
// ENFORCEMENT_MAP.allowedRoles — which IS the contract requireOrgRole enforces
// today. So "can() === allowedRoles.includes(role)" is simultaneously:
//   T2 (exhaustive 27×3 grant-set reproduction) and
//   T3 (differential can() vs requireOrgRole — zero divergence for system roles).
vi.mock("../role-matrix-loader", () => ({
  loadRoleMatrix: vi.fn(async () => ROLE_PERMISSIONS),
}));

import { can } from "../can";
import { ENFORCEMENT_MAP } from "../enforcement-map";
import type { Actor, Permission } from "../types";
import type { MemberRole } from "@prisma/client";

const ORG = "org-truth-uuid";
const SYSTEM_ROLES: MemberRole[] = ["OWNER", "ADMIN", "MEMBER"];

function actorWithRole(role: MemberRole): Actor {
  return {
    profileId: "p-truth",
    isSuperAdmin: false,
    memberships: [
      {
        organizationId: ORG,
        status: "ACTIVE",
        roles: [{ role, scopeType: "ORG", scopeId: null }],
      },
    ],
  };
}

function permFor(entry: (typeof ENFORCEMENT_MAP)[keyof typeof ENFORCEMENT_MAP]): Permission {
  return {
    resource: entry.resource,
    action: entry.action,
    scopeType: entry.scopeType,
  };
}

describe("can() authoritative — reproduces ENFORCEMENT_MAP grant-sets (T2 + T3)", () => {
  const entries = Object.entries(ENFORCEMENT_MAP);

  it("covers all 33 ORG-scoped enforcement-map entries", () => {
    expect(entries.length).toBe(33); // 27 (V1→4a) + 6 (Fase 5: roles CRUD + assign)
  });

  for (const [routeId, entry] of entries) {
    for (const role of SYSTEM_ROLES) {
      const expected = (entry.allowedRoles as readonly string[]).includes(role);
      it(`${routeId} × ${role} → ${expected ? "permit" : "deny"}`, async () => {
        const result = await can(actorWithRole(role), permFor(entry), ORG);
        expect(result).toBe(expected);
      });
    }
  }
});

describe("can() authoritative — edge cases", () => {
  it("no roles → deny everything", async () => {
    const actor: Actor = {
      profileId: "p",
      isSuperAdmin: false,
      memberships: [{ organizationId: ORG, status: "ACTIVE", roles: [] }],
    };
    expect(await can(actor, { resource: "locations", action: "read" }, ORG)).toBe(false);
  });

  it("org mismatch → deny (no membership for the target org)", async () => {
    const actor = actorWithRole("OWNER"); // member of ORG
    expect(
      await can(actor, { resource: "org", action: "delete" }, "some-other-org")
    ).toBe(false);
  });

  it("unmapped action on a mapped resource → default-deny", async () => {
    // MEMBER cannot create locations; OWNER has no 'invite' on locations.
    expect(await can(actorWithRole("OWNER"), { resource: "locations", action: "invite" }, ORG)).toBe(false);
  });

  it("Owner-only routes deny ADMIN and MEMBER", async () => {
    const orgDelete: Permission = { resource: "org", action: "delete", scopeType: "org" };
    expect(await can(actorWithRole("OWNER"), orgDelete, ORG)).toBe(true);
    expect(await can(actorWithRole("ADMIN"), orgDelete, ORG)).toBe(false);
    expect(await can(actorWithRole("MEMBER"), orgDelete, ORG)).toBe(false);
  });
});
