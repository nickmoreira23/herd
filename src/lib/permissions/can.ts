import type { Actor, Permission } from "./types";
import { ROLE_PERMISSIONS } from "./role-permissions";

/**
 * Checks whether an actor can execute the given permission in the context of orgId.
 *
 * Logic:
 * 1. Super_admin → always true.
 * 2. Find membership for orgId. None → false.
 * 3. For each role in membership, check whether the role grants the permission.
 * 4. Scope check: if permission.scopeType=department, the role must have
 *    scopeType=DEPARTMENT + scopeId === permission.scopeId.
 */
export function can(
  actor: Actor,
  permission: Permission,
  organizationId: string
): boolean {
  // 1. Super_admin bypass
  if (actor.isSuperAdmin) return true;

  // 2. Membership for this org
  const membership = actor.memberships.find(
    (m) => m.organizationId === organizationId
  );
  if (!membership) return false;

  // 3. Check each role
  for (const actorRole of membership.roles) {
    const rolePermissions = ROLE_PERMISSIONS[actorRole.role] ?? [];

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
