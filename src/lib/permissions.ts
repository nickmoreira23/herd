import { prisma } from "@/lib/prisma";

/**
 * Resolve whether a network profile has a specific permission.
 *
 * Algorithm (5-step):
 * 1. Check ProfilePermissionOverride DENY → return false
 * 2. Check ProfilePermissionOverride GRANT → return true
 * 3. Collect roles via ProfileRole, walk parent_role_id chain
 * 4. Check RolePermission for matching resource+action → return true
 * 5. Default deny → return false
 */
export async function resolvePermission(
  profileId: string,
  resource: string,
  action: string
): Promise<boolean> {
  // Find the permission record
  const permission = await prisma.networkPermission.findUnique({
    where: { resource_action: { resource, action } },
  });

  if (!permission) return false;

  // Step 1 & 2: Check profile-level overrides
  const override = await prisma.networkProfilePermissionOverride.findUnique({
    where: {
      profileId_permissionId: {
        profileId,
        permissionId: permission.id,
      },
    },
  });

  if (override) {
    return override.effect === "GRANT";
  }

  // Step 3: Get direct role IDs
  const profileRoles = await prisma.networkProfileRole.findMany({
    where: { profileId },
    select: { roleId: true },
  });

  if (profileRoles.length === 0) return false;

  const directRoleIds = profileRoles.map((pr) => pr.roleId);

  // Walk the role inheritance chain with recursive CTE
  const roleChain: { id: string }[] = await prisma.$queryRawUnsafe(
    `
    WITH RECURSIVE role_chain AS (
      SELECT id, parent_role_id FROM network_roles WHERE id = ANY($1::uuid[])
      UNION
      SELECT r.id, r.parent_role_id FROM network_roles r
      JOIN role_chain rc ON r.id = rc.parent_role_id
      WHERE rc.parent_role_id IS NOT NULL
    )
    SELECT id FROM role_chain
    `,
    directRoleIds
  );

  const allRoleIds = roleChain.map((r) => r.id);

  // Step 4: Check role permissions
  const rolePermission = await prisma.networkRolePermission.findFirst({
    where: {
      roleId: { in: allRoleIds },
      permissionId: permission.id,
    },
  });

  return !!rolePermission;
}
