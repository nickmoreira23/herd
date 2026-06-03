import { prisma } from "@/lib/prisma";
import type { ActionType, Permission, ResourceType } from "./types";

/**
 * Role → permission matrix, keyed by the role's string identity: a system role's
 * `MemberRole` enum value (e.g. "OWNER") or a custom role's UUID (`roleId`). can()
 * looks up `matrix[actorRole.role]`; in Fase 3 memberships only carry system roles,
 * so custom-role keys are emitted but not yet reachable (Fase 5/6 assign them).
 */
export type RoleMatrix = Record<string, Permission[]>;

/**
 * V3.2 → Fase 3. Loads the matrix from `role_permissions`, merging global rows
 * (`tenant_id IS NULL` — the 97 system rows + any global custom) with the given
 * org's overrides (`tenant_id = orgId`). The merge is ADDITIVE: overrides only add
 * grants; deny/revocation semantics are deferred to Fase 6. Shape matches the old
 * constant so can()'s decision logic is unchanged (ORG grants omit `scopeType`;
 * DEPARTMENT grants carry `scopeType: "department"`).
 *
 * Per-request read, no cache (tracked tech debt). Called only when
 * CAN_ENFORCEMENT != off, after can()'s super_admin/no-membership short-circuits.
 * `orgId` omitted → globals only (e.g. the read-only matrix page).
 */
export async function loadRoleMatrix(orgId?: string): Promise<RoleMatrix> {
  const rows = await prisma.rolePermission.findMany({
    where: orgId
      ? { OR: [{ tenantId: null }, { tenantId: orgId }] }
      : { tenantId: null },
    select: { role: true, roleId: true, resource: true, action: true, scopeType: true },
  });
  const matrix: RoleMatrix = {};
  for (const row of rows) {
    const key = row.role ?? row.roleId;
    if (!key) continue; // CHECK guarantees exactly one is set; defensive.
    (matrix[key] ??= []).push({
      resource: row.resource as ResourceType,
      action: row.action as ActionType,
      ...(row.scopeType === "DEPARTMENT"
        ? { scopeType: "department" as const }
        : {}),
    });
  }
  return matrix;
}
