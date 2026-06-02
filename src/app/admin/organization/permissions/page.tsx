import { redirect } from "next/navigation";
import { connection } from "next/server";
import { requireOrgRole } from "@/lib/permissions";
import type { ActionType, ResourceType } from "@/lib/permissions";
import { loadRoleMatrix } from "@/lib/permissions/role-matrix-loader";
import { GHOST_RESOURCES } from "@/lib/permissions/enforcement-map";
import type { MemberRole } from "@prisma/client";
import { PermissionsMatrix } from "@/components/organization/permissions-matrix";

// Canonical display order. Kept explicit (not derived from the union) so the
// matrix renders deterministically and shows resources even when no role grants
// them. `satisfies` lets TS reject a typo without forcing exhaustiveness.
const RESOURCES = [
  "org",
  "org_settings",
  "org_billing",
  "org_hierarchy",
  "members",
  "departments",
  "locations",
  "audit_log",
  "integrations",
  "blocks_schema",
  "blocks_data",
] as const satisfies readonly ResourceType[];

const ACTIONS = [
  "read",
  "create",
  "update",
  "delete",
  "invite",
] as const satisfies readonly ActionType[];

const ROLES = [
  "OWNER",
  "ADMIN",
  "MEMBER",
  "DEPARTMENT_HEAD",
  "DEPARTMENT_MANAGER",
  "DEPARTMENT_MEMBER",
] as const satisfies readonly MemberRole[];

// Department-scoped roles are defined in the model but not yet used as access
// gates (no requireOrgRole call-site passes them). Flagged as inert in the UI.
const DEPARTMENT_ROLES: MemberRole[] = [
  "DEPARTMENT_HEAD",
  "DEPARTMENT_MANAGER",
  "DEPARTMENT_MEMBER",
];

// ORG-scoped roles — the editable columns in the matrix (super_admin only).
const ORG_ROLES: MemberRole[] = ["OWNER", "ADMIN", "MEMBER"];

export default async function PermissionsPage() {
  await connection();

  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN", "MEMBER"]);
  if (sessionOrResponse instanceof Response) redirect("/login");

  // Editing the global matrix is super_admin-only (the endpoint enforces it too).
  // Non-super members keep the read-only matrix.
  const canEdit =
    (sessionOrResponse.user as { isSuperAdmin?: boolean }).isSuperAdmin === true;

  // Serialize the DB-backed matrix (V3.2 loader) into a flat, client-safe shape:
  // role → list of "resource:action" grant keys. The matrix now reflects the
  // editable `role_permissions` table, so super_admin edits show after refresh.
  const matrix = await loadRoleMatrix();
  const grants: Record<string, string[]> = {};
  for (const role of ROLES) {
    const keys = new Set<string>();
    for (const p of matrix[role] ?? []) {
      keys.add(`${p.resource}:${p.action}`);
    }
    grants[role] = Array.from(keys);
  }

  return (
    <PermissionsMatrix
      resources={[...RESOURCES]}
      actions={[...ACTIONS]}
      roles={[...ROLES]}
      departmentRoles={DEPARTMENT_ROLES}
      ghostResources={[...GHOST_RESOURCES]}
      editableRoles={[...ORG_ROLES]}
      canEdit={canEdit}
      grants={grants}
    />
  );
}
