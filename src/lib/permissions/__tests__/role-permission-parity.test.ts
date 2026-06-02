import { describe, it, expect } from "vitest";
import { ROLE_PERMISSIONS } from "../role-permissions";
import { rolePermissionRows } from "../../../../scripts/seed-role-permissions";

/**
 * Seed-parity gate (re-framed in V3.3).
 *
 * Parity is a property of the SEED, not of the live table: the seed must
 * materialize EXACTLY ROLE_PERMISSIONS. This is the inertia guarantee for the
 * flip — when the table is seeded (untouched), can() reading from it == can()
 * reading the constant.
 *
 * Pre-V3.3 this read the live `role_permissions` table. V3.3 ships the editor,
 * so the live DB can now legitimately diverge from the constant (super_admin
 * edits). A live-table parity assertion would therefore be wrong. We instead
 * assert the seed's OUTPUT (`rolePermissionRows()`) bidirectionally equals the
 * constant — pure, no DB, robust to post-edit divergence.
 */
function rowKey(r: {
  role: string;
  resource: string;
  action: string;
  scopeType: string;
}) {
  return `${r.role}|${r.resource}|${r.action}|${r.scopeType}`;
}

function expectedKeys(): Set<string> {
  const set = new Set<string>();
  for (const role of Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]) {
    for (const g of ROLE_PERMISSIONS[role]) {
      const scopeType = g.scopeType === "department" ? "DEPARTMENT" : "ORG";
      set.add(rowKey({ role, resource: g.resource, action: g.action, scopeType }));
    }
  }
  return set;
}

describe("seed parity — rolePermissionRows() == ROLE_PERMISSIONS", () => {
  it("matches the hardcoded matrix exactly (bidirectional)", () => {
    const actual = new Set(rolePermissionRows().map(rowKey));
    const expected = expectedKeys();

    expect(actual.size).toBe(expected.size);
    expect([...expected].filter((k) => !actual.has(k))).toEqual([]); // none missing
    expect([...actual].filter((k) => !expected.has(k))).toEqual([]); // none extra
  });
});
