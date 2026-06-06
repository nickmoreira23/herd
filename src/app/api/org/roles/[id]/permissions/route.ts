import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-utils";
import { requireOrgRole, enforceRoute } from "@/lib/permissions";
import { withTenant } from "@/lib/tenancy/context";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { upsertGrant, removeGrant } from "@/lib/permissions/grant-repository";
import { GRANT_RESOURCES, GRANT_ACTIONS } from "@/lib/permissions/grant-catalog";

/**
 * R&P Fase 7c-2a — grant editor for a custom role. Writes positive grants ONLY
 * (D15; deny lives in the 6c override editor). All writes go through the choke
 * point (D8) with a per-org, roleId-only slot. The loader (keyed by
 * `role ?? roleId`) and resolveViewerPermissions (`roleId ?? role`) already
 * reflux these into can()/UI — nothing in the resolution layer changes.
 *
 * Editable surface = GRANT_RESOURCES × GRANT_ACTIONS (shared catalog), ORG scope.
 */
const bodySchema = z.object({
  resource: z.enum(GRANT_RESOURCES),
  action: z.enum(GRANT_ACTIONS),
});

/** Stable machine error codes — the UI maps by code, never by prose. */
function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

/** Confirm the role exists in the caller's org (tenant-scoped read → 404, no leak). */
async function findRoleInOrg(id: string): Promise<{ id: string } | null> {
  return prisma.role.findUnique({ where: { id }, select: { id: true } });
}

/** GET — list the custom role's current positive grants (OWNER/ADMIN read). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;
  const orgId = session.user.activeOrgId;
  if (!orgId) return err("no_active_org", "No active organization", 400);

  const enforced = await enforceRoute(session, { resource: "roles", action: "read" }, {
    current: session, organizationId: orgId, routeId: "GET /api/org/roles/[id]/permissions",
  });
  if (enforced instanceof Response) return enforced;

  const { id } = await params;
  return withTenant(orgId, async () => {
    if (!(await findRoleInOrg(id))) return err("role_not_found", "Role not found", 404);
    const grants = await prisma.rolePermission.findMany({
      where: { roleId: id, tenantId: orgId, effect: "grant", scopeType: "ORG" },
      select: { resource: true, action: true },
    });
    return apiSuccess({ grants });
  });
}

/** POST — grant one {resource, action} to the role (OWNER-only). effect is always "grant". */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessionOrResponse = await requireOrgRole(["OWNER"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;
  const orgId = session.user.activeOrgId;
  if (!orgId) return err("no_active_org", "No active organization", 400);

  const enforced = await enforceRoute(session, { resource: "roles", action: "update" }, {
    current: session, organizationId: orgId, routeId: "POST /api/org/roles/[id]/permissions",
  });
  if (enforced instanceof Response) return enforced;

  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return err("invalid_grant", "Resource/action is not grantable", 422);
  const { resource, action } = parsed.data;

  return withTenant(orgId, async () => {
    if (!(await findRoleInOrg(id))) return err("role_not_found", "Role not found", 404);
    await upsertGrant(
      { tenantId: orgId, role: null, roleId: id, resource, action, scopeType: "ORG" },
      "grant",
    );
    await writeAuditLog({
      tenantId: orgId,
      actorProfileId: (session.user as { id?: string }).id ?? null,
      action: "role_permission.granted",
      resourceType: "roles",
      resourceId: id,
      metadata: { resource, action, roleId: id },
    });
    return apiSuccess({ resource, action, granted: true });
  });
}

/** DELETE — revoke one {resource, action} from the role (OWNER-only). */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessionOrResponse = await requireOrgRole(["OWNER"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;
  const orgId = session.user.activeOrgId;
  if (!orgId) return err("no_active_org", "No active organization", 400);

  const enforced = await enforceRoute(session, { resource: "roles", action: "update" }, {
    current: session, organizationId: orgId, routeId: "DELETE /api/org/roles/[id]/permissions",
  });
  if (enforced instanceof Response) return enforced;

  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return err("invalid_grant", "Resource/action is not grantable", 422);
  const { resource, action } = parsed.data;

  return withTenant(orgId, async () => {
    if (!(await findRoleInOrg(id))) return err("role_not_found", "Role not found", 404);
    await removeGrant({ tenantId: orgId, role: null, roleId: id, resource, action, scopeType: "ORG" });
    await writeAuditLog({
      tenantId: orgId,
      actorProfileId: (session.user as { id?: string }).id ?? null,
      action: "role_permission.revoked",
      resourceType: "roles",
      resourceId: id,
      metadata: { resource, action, roleId: id },
    });
    return apiSuccess({ resource, action, granted: false });
  });
}
