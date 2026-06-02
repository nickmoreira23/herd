import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { requireOrgRole, enforceRoute } from "@/lib/permissions";
import { withTenant } from "@/lib/tenancy/context";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN", "MEMBER"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const enforced = await enforceRoute(
    session,
    { resource: "departments", action: "read" },
    { current: session, organizationId: session.user.activeOrgId ?? "", routeId: "GET /api/departments/[id]" }
  );
  if (enforced instanceof Response) return enforced;

  const { id } = await params;
  return withTenant(session.user.activeOrgId ?? "", async () => {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        head: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        children: {
          include: {
            head: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { members: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
        members: {
          include: {
            profile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                status: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!department) return apiError("Department not found", 404);
    return apiSuccess(department);
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const enforced = await enforceRoute(
    session,
    { resource: "departments", action: "update" },
    { current: session, organizationId: session.user.activeOrgId ?? "", routeId: "PATCH /api/departments/[id]" }
  );
  if (enforced instanceof Response) return enforced;

  const { id } = await params;
  return withTenant(session.user.activeOrgId ?? "", async () => {
    try {
      const body = await request.json();
      const { name, description, parentId, headId, color, icon, sortOrder } = body;

      const updates: Record<string, unknown> = {};
      if (name !== undefined) {
        updates.name = name;
        updates.slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }
      if (description !== undefined) updates.description = description || null;
      if (parentId !== undefined) updates.parentId = parentId || null;
      if (headId !== undefined) updates.headId = headId || null;
      if (color !== undefined) updates.color = color || null;
      if (icon !== undefined) updates.icon = icon || null;
      if (sortOrder !== undefined) updates.sortOrder = sortOrder;

      const department = await prisma.department.update({
        where: { id },
        data: updates,
        include: {
          parent: { select: { id: true, name: true } },
          head: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await writeAuditLog({
        tenantId: session.user.activeOrgId ?? "",
        actorProfileId: session.user.id,
        action: "department.updated",
        resourceType: "department",
        resourceId: id,
        metadata: { fields: Object.keys(updates) },
      });

      return apiSuccess(department);
    } catch {
      return apiError("Failed to update department", 500);
    }
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const enforced = await enforceRoute(
    session,
    { resource: "departments", action: "delete" },
    { current: session, organizationId: session.user.activeOrgId ?? "", routeId: "DELETE /api/departments/[id]" }
  );
  if (enforced instanceof Response) return enforced;

  const { id } = await params;
  return withTenant(session.user.activeOrgId ?? "", async () => {
    try {
      await prisma.department.delete({ where: { id } });
      await writeAuditLog({
        tenantId: session.user.activeOrgId ?? "",
        actorProfileId: session.user.id,
        action: "department.deleted",
        resourceType: "department",
        resourceId: id,
      });
      return apiSuccess({ deleted: true });
    } catch {
      return apiError("Failed to delete department", 500);
    }
  });
}
