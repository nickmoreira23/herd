import { redirect } from "next/navigation";
import { connection } from "next/server";
import { requireOrgRole, getActor } from "@/lib/permissions";
import { loadRoleMatrix } from "@/lib/permissions/role-matrix-loader";
import { OWNER_FLOOR } from "@/lib/permissions/admin-floor";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenancy/context";
import { RoleOverrideMatrix } from "@/components/organization/role-override-matrix";

const RESOURCES = ["org", "org_hierarchy", "members", "invitations", "roles", "departments", "locations"] as const;
const ACTIONS = ["read", "create", "update", "delete", "invite", "restore"] as const;
const SYSTEM_ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;

/**
 * R&P Fase 6c — per-org override editor. OWNER edits; ADMIN reads; MEMBER has no
 * access. Shows the org's RESOLVED matrix (loadRoleMatrix(orgId)) + explicit
 * per-org overrides so cells render grant/deny/inherited. The OWNER floor is locked.
 */
export default async function RoleOverridesPage() {
  await connection();

  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) redirect("/admin"); // MEMBER / non-member
  const session = sessionOrResponse;
  const orgId = session.user.activeOrgId;
  if (!orgId) redirect("/admin");

  const actor = await getActor(session);
  const ownerRole = actor?.memberships
    .find((m) => m.organizationId === orgId)
    ?.roles.some((r) => r.role === "OWNER" && r.scopeType === "ORG");
  const canEdit = ownerRole === true;

  // Resolved matrix for this org (global + overrides, deny applied, floor protected).
  const matrix = await loadRoleMatrix(orgId);
  const resolved: Record<string, string[]> = {};
  for (const [key, perms] of Object.entries(matrix)) {
    resolved[key] = perms.map((p) => `${p.resource}:${p.action}`);
  }

  // Explicit per-org overrides + this org's custom roles.
  const [overrideRows, customRoles] = await withTenant(orgId, () =>
    Promise.all([
      prisma.rolePermission.findMany({
        where: { tenantId: orgId },
        select: { role: true, roleId: true, resource: true, action: true, effect: true },
      }),
      prisma.role.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ])
  );
  const overrides: Record<string, string> = {}; // "key:resource:action" -> effect
  for (const r of overrideRows) {
    const key = r.role ?? r.roleId;
    if (key) overrides[`${key}:${r.resource}:${r.action}`] = r.effect;
  }

  return (
    <RoleOverrideMatrix
      resources={[...RESOURCES]}
      actions={[...ACTIONS]}
      systemRoles={[...SYSTEM_ROLES]}
      customRoles={customRoles}
      resolved={resolved}
      overrides={overrides}
      floor={OWNER_FLOOR.map((f) => `${f.resource}:${f.action}`)}
      canEdit={canEdit}
    />
  );
}
