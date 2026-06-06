import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { requireOrgRole, enforceRoute } from "@/lib/permissions";
import { withTenant } from "@/lib/tenancy/context";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

const RESERVED = new Set([
  "owner", "admin", "member",
  "department_head", "department_manager", "department_member",
]);

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  key: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
});

/** PATCH /api/org/roles/[id] — edit a custom role's name/key/description. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;
  const orgId = session.user.activeOrgId;
  if (!orgId) return apiError("No active organization", 400);

  const enforced = await enforceRoute(session, { resource: "roles", action: "update" }, {
    current: session, organizationId: orgId, routeId: "PATCH /api/org/roles/[id]",
  });
  if (enforced instanceof Response) return enforced;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Invalid role", 400, parsed.error.flatten());
  const { name, key, description } = parsed.data;

  if ((key && RESERVED.has(key.toLowerCase())) || (name && RESERVED.has(name.toLowerCase()))) {
    return apiError("Name/key collides with a system role", 422, undefined, "name_reserved");
  }

  const actorProfileId = (session.user as { id?: string }).id ?? null;

  return withTenant(orgId, async () => {
    // Tenant-scoped read confirms the role belongs to this org (else 404, no leak).
    const existing = await prisma.role.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return apiError("Role not found", 404);

    try {
      const updated = await prisma.role.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(key !== undefined ? { key } : {}),
          ...(description !== undefined ? { description } : {}),
        },
        select: { id: true, name: true, key: true, description: true },
      });
      await writeAuditLog({
        tenantId: orgId, actorProfileId, action: "role.updated",
        resourceType: "roles", resourceId: id, metadata: { name, key },
      });
      return apiSuccess(updated);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return apiError("A role with this key already exists", 422, undefined, "key_duplicate");
      }
      throw e;
    }
  });
}

/** DELETE /api/org/roles/[id] — delete a custom role; blocked while assigned to members. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;
  const orgId = session.user.activeOrgId;
  if (!orgId) return apiError("No active organization", 400);

  const enforced = await enforceRoute(session, { resource: "roles", action: "delete" }, {
    current: session, organizationId: orgId, routeId: "DELETE /api/org/roles/[id]",
  });
  if (enforced instanceof Response) return enforced;

  const { id } = await params;
  const actorProfileId = (session.user as { id?: string }).id ?? null;

  return withTenant(orgId, async () => {
    const existing = await prisma.role.findUnique({
      where: { id },
      select: { id: true, _count: { select: { membershipRoles: true } } },
    });
    if (!existing) return apiError("Role not found", 404);

    // Invariant: never delete a role still assigned to members (require unassign first).
    if (existing._count.membershipRoles > 0) {
      return apiError("Role is assigned to members; unassign them first", 409);
    }

    await prisma.role.delete({ where: { id } });
    await writeAuditLog({
      tenantId: orgId, actorProfileId, action: "role.deleted",
      resourceType: "roles", resourceId: id, metadata: {},
    });
    return apiSuccess({ id, deleted: true });
  });
}
