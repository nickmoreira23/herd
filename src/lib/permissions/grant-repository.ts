import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { MemberRole, RoleEffect, RoleScopeType } from "@prisma/client";

/**
 * R&P Fase 6a — the SINGLE write choke point for `role_permissions`.
 *
 * After dropping the legacy `@@unique([role,resource,action,scopeType])` (it ignored
 * tenant_id and blocked per-org overrides), uniqueness is enforced APP-LEVEL here:
 * "one row per logical slot" = (tenant_id, role, role_id, resource, action,
 * scope_type). We deliberately do NOT use a DB partial / NULLS NOT DISTINCT unique —
 * Prisma 7 can't model it, so it would drift and break the empty-_probe invariant.
 *
 * EVERY insert/update/delete of a grant must go through this module. `effect`
 * (grant|deny) is carried but NOT yet processed by the loader (Fase 6b).
 */
export interface GrantSlot {
  tenantId: string | null; // null = global
  role: MemberRole | null; // system role, XOR roleId
  roleId: string | null; // custom role, XOR role
  resource: string;
  action: string;
  scopeType: RoleScopeType;
}

type Db = Prisma.TransactionClient | typeof prisma;

const slotWhere = (s: GrantSlot): Prisma.RolePermissionWhereInput => ({
  tenantId: s.tenantId,
  role: s.role,
  roleId: s.roleId,
  resource: s.resource,
  action: s.action,
  scopeType: s.scopeType,
});

const slotKey = (s: GrantSlot) =>
  `${s.tenantId ?? ""}|${s.role ?? ""}|${s.roleId ?? ""}|${s.resource}|${s.action}|${s.scopeType}`;

/**
 * Create-or-update the single row for `slot` with the given effect. Atomic
 * (find + write in one transaction) so concurrent writers can't double-insert a
 * slot. Returns the row id.
 */
export async function upsertGrant(slot: GrantSlot, effect: RoleEffect = "grant"): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.rolePermission.findFirst({ where: slotWhere(slot), select: { id: true } });
    if (existing) {
      await tx.rolePermission.update({ where: { id: existing.id }, data: { effect } });
      return existing.id;
    }
    const created = await tx.rolePermission.create({
      data: {
        tenantId: slot.tenantId, role: slot.role, roleId: slot.roleId,
        resource: slot.resource, action: slot.action, scopeType: slot.scopeType, effect,
      },
      select: { id: true },
    });
    return created.id;
  });
}

/** Remove the row(s) for `slot`. Returns the number deleted (0 or 1). */
export async function removeGrant(slot: GrantSlot): Promise<number> {
  const res = await prisma.rolePermission.deleteMany({ where: slotWhere(slot) });
  return res.count;
}

/**
 * Slot-safe bulk insert for the seed (documented bulk exception): inserts only the
 * slots NOT already present, so it is idempotent without the dropped DB unique and
 * never duplicates a slot. All seeded rows are grants. Two queries, no per-row
 * round-trip. Returns the number inserted.
 */
export async function bulkEnsureGrants(db: Db, slots: GrantSlot[]): Promise<number> {
  const existing = await db.rolePermission.findMany({
    select: { tenantId: true, role: true, roleId: true, resource: true, action: true, scopeType: true },
  });
  const have = new Set(existing.map((r) => slotKey(r as GrantSlot)));
  const missing = slots.filter((s) => !have.has(slotKey(s)));
  if (missing.length > 0) {
    await db.rolePermission.createMany({
      data: missing.map((s) => ({ ...s, effect: "grant" as RoleEffect })),
    });
  }
  return missing.length;
}
