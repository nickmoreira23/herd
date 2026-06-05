import { prisma } from "@/lib/prisma";
import type { ActionType, Permission, ResourceType } from "./types";
import { isOwnerFloor } from "./admin-floor";

/**
 * Role → permission matrix, keyed by the role's string identity: a system role's
 * `MemberRole` enum value (e.g. "OWNER") or a custom role's UUID (`roleId`).
 */
export type RoleMatrix = Record<string, Permission[]>;

/**
 * Fase 6b — loads the matrix from `role_permissions` and resolves `effect`
 * (grant|deny) with a DETERMINISTIC precedence (no reliance on query ordering):
 *
 *   OWNER_FLOOR (piso) > deny per-org > grant per-org > grant global
 *
 * - Reads global rows (`tenant_id IS NULL`) + the org's overrides (`tenant_id = orgId`).
 * - A slot = (role|roleId, resource, action, scope_type). A deny on a slot removes
 *   the grant for that slot (deny wins over grant).
 * - EXCEPTION (anti-self-lockout): when the slot is OWNER × an OWNER_FLOOR
 *   (resource, action) at ORG scope, the deny is IGNORED — the floor is inviolable.
 *   The floor protects ONLY the OWNER system role; ADMIN/MEMBER/custom have no floor.
 *
 * With zero deny/override (today's PROD/DEV), the result is identical to the old
 * additive matrix. Per-request read, no cache. `orgId` omitted → globals only.
 */
export async function loadRoleMatrix(orgId?: string): Promise<RoleMatrix> {
  const rows = await prisma.rolePermission.findMany({
    where: orgId
      ? { OR: [{ tenantId: null }, { tenantId: orgId }] }
      : { tenantId: null },
    select: { role: true, roleId: true, resource: true, action: true, scopeType: true, effect: true },
  });

  type Slot = { key: string; resource: string; action: string; scopeType: string };
  const slotId = (key: string, resource: string, action: string, scopeType: string) =>
    `${key}|${resource}|${action}|${scopeType}`;

  const grants = new Map<string, Slot>();
  const denies = new Set<string>();

  for (const row of rows) {
    const key = row.role ?? row.roleId;
    if (!key) continue; // CHECK guarantees exactly one is set; defensive.
    const id = slotId(key, row.resource, row.action, row.scopeType);
    if (row.effect === "deny") denies.add(id);
    else grants.set(id, { key, resource: row.resource, action: row.action, scopeType: row.scopeType });
  }

  const matrix: RoleMatrix = {};
  for (const [id, slot] of grants) {
    const denied = denies.has(id);
    const floorProtected =
      slot.key === "OWNER" &&
      slot.scopeType === "ORG" &&
      isOwnerFloor(slot.resource as ResourceType, slot.action as ActionType);
    // deny wins over grant, UNLESS the OWNER floor protects this slot.
    if (denied && !floorProtected) continue;
    (matrix[slot.key] ??= []).push({
      resource: slot.resource as ResourceType,
      action: slot.action as ActionType,
      ...(slot.scopeType === "DEPARTMENT" ? { scopeType: "department" as const } : {}),
    });
  }
  return matrix;
}
