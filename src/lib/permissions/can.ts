import type { Actor, Permission } from "./types";
import { loadRoleMatrix } from "./role-matrix-loader";

/**
 * Checks whether an actor can execute the given permission in the context of orgId.
 *
 * V3.2: async — the role→permission matrix now comes from the DB
 * (`loadRoleMatrix`, backed by the `role_permissions` table) instead of the
 * hardcoded constant. The decision logic is unchanged; only the source moved.
 * The matrix is loaded only after the super_admin / no-membership
 * short-circuits, so those paths stay query-free.
 *
 * Logic:
 * 1. Super_admin → always true.
 * 2. Find membership for orgId. None → false.
 * 3. For each role in membership, check whether the role grants the permission.
 * 4. Scope check: if permission.scopeType=department, the role must have
 *    scopeType=DEPARTMENT + scopeId === permission.scopeId.
 */
export async function can(
  actor: Actor,
  permission: Permission,
  organizationId: string
): Promise<boolean> {
  // 1. Super_admin bypass
  if (actor.isSuperAdmin) return true;

  // 2. Membership for this org
  const membership = actor.memberships.find(
    (m) => m.organizationId === organizationId
  );
  if (!membership) return false;

  // 3. Check each role against the DB-backed matrix (global + this org's overrides)
  const matrix = await loadRoleMatrix(organizationId);
  for (const actorRole of membership.roles) {
    // Custom roles key the matrix by roleId; system roles by the MemberRole enum.
    const matrixKey = actorRole.roleId ?? actorRole.role;
    if (!matrixKey) continue; // CHECK guarantees one is set; defensive.
    const rolePermissions = matrix[matrixKey] ?? [];

    for (const granted of rolePermissions) {
      // Resource + action must match
      if (granted.resource !== permission.resource) continue;
      if (granted.action !== permission.action) continue;

      // Scope check
      if (granted.scopeType) {
        // This grant has a scope restriction
        if (permission.scopeType !== granted.scopeType) continue;

        // Department scope: actor role must carry a matching scopeId
        if (granted.scopeType === "department") {
          if (actorRole.scopeType !== "DEPARTMENT") continue;
          if (actorRole.scopeId !== permission.scopeId) continue;
        }
      }

      return true;
    }
  }

  return false;
}
