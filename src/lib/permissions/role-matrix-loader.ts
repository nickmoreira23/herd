import { prisma } from "@/lib/prisma";
import type { MemberRole } from "@prisma/client";
import type { ActionType, Permission, ResourceType } from "./types";

export type RoleMatrix = Record<MemberRole, Permission[]>;

/**
 * V3.2 — loads the role→permission matrix from the global `role_permissions`
 * table, shaped EXACTLY like the hardcoded ROLE_PERMISSIONS so can()'s decision
 * logic is unchanged: ORG grants omit `scopeType`; DEPARTMENT grants carry
 * `scopeType: "department"` (bridging the uppercase RoleScopeType enum back to
 * the lowercase model literal).
 *
 * Per-request read, no cache (V3 decision; caching is tracked tech debt). Only
 * runs when CAN_ENFORCEMENT != off — can() is the sole caller, and it loads the
 * matrix only after the super_admin/no-membership short-circuits.
 */
export async function loadRoleMatrix(): Promise<RoleMatrix> {
  const rows = await prisma.rolePermission.findMany({
    select: { role: true, resource: true, action: true, scopeType: true },
  });
  const matrix = {} as RoleMatrix;
  for (const row of rows) {
    (matrix[row.role] ??= []).push({
      resource: row.resource as ResourceType,
      action: row.action as ActionType,
      ...(row.scopeType === "DEPARTMENT"
        ? { scopeType: "department" as const }
        : {}),
    });
  }
  return matrix;
}
