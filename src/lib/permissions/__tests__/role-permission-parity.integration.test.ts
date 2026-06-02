import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ROLE_PERMISSIONS } from "@/lib/permissions/role-permissions";
import { seedRolePermissions } from "../../../../scripts/seed-role-permissions";

/**
 * V3.1 parity gate — proves the global `role_permissions` table equals the
 * hardcoded ROLE_PERMISSIONS, bidirectionally (no grant extra, none missing).
 * This is the inertia guarantee for the future flip: as long as the table ==
 * the constant, flipping CAN_ENFORCEMENT changes nothing.
 *
 * Seeds via the shared seedRolePermissions (idempotent upsert); does NOT tear
 * the table down — these rows are the canonical global matrix, not a fixture.
 */
const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!url) throw new Error("DATABASE_URL or DIRECT_URL required");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

/** Canonical key for a grant: role|resource|action|ORG|DEPARTMENT. */
function key(role: string, resource: string, action: string, scopeType: string) {
  return `${role}|${resource}|${action}|${scopeType}`;
}

function expectedKeys(): Set<string> {
  const set = new Set<string>();
  for (const role of Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]) {
    for (const g of ROLE_PERMISSIONS[role]) {
      const scopeType = g.scopeType === "department" ? "DEPARTMENT" : "ORG";
      set.add(key(role, g.resource, g.action, scopeType));
    }
  }
  return set;
}

beforeAll(async () => {
  await seedRolePermissions(db); // idempotent
});

afterAll(async () => {
  await db.$disconnect();
});

describe("RolePermission table parity with ROLE_PERMISSIONS", () => {
  it("matches the hardcoded matrix exactly (bidirectional)", async () => {
    const rows = await db.rolePermission.findMany({
      select: { role: true, resource: true, action: true, scopeType: true },
    });
    const actual = new Set(
      rows.map((r) => key(r.role, r.resource, r.action, r.scopeType))
    );
    const expected = expectedKeys();

    // Same count.
    expect(actual.size).toBe(expected.size);

    // No grant missing from the table.
    const missing = [...expected].filter((k) => !actual.has(k));
    expect(missing).toEqual([]);

    // No grant in the table beyond the constant.
    const extra = [...actual].filter((k) => !expected.has(k));
    expect(extra).toEqual([]);
  });
});
