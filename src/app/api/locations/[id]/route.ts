import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateLocationSchema } from "@/lib/validators/locations";
import type { Prisma } from "@prisma/client";
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
    { resource: "locations", action: "read" },
    { current: session, organizationId: session.user.activeOrgId ?? "", routeId: "GET /api/locations/[id]" }
  );
  if (enforced instanceof Response) return enforced;

  const { id } = await params;
  return withTenant(session.user.activeOrgId ?? "", async () => {
    try {
      const location = await prisma.location.findUnique({ where: { id } });
      if (!location) return apiError("Location not found", 404);
      return apiSuccess(location);
    } catch (e) {
      console.error("GET /api/locations/[id] error:", e);
      return apiError("Failed to fetch location", 500);
    }
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
    { resource: "locations", action: "update" },
    { current: session, organizationId: session.user.activeOrgId ?? "", routeId: "PATCH /api/locations/[id]" }
  );
  if (enforced instanceof Response) return enforced;

  const { id } = await params;
  const result = await parseAndValidate(request, updateLocationSchema);
  if ("error" in result) return result.error;

  return withTenant(session.user.activeOrgId ?? "", async () => {
    try {
      const body = result.data;
      const existing = await prisma.location.findUnique({ where: { id } });
      if (!existing) return apiError("Location not found", 404);

      if (body.isHeadquarters) {
        await prisma.location.updateMany({
          where: { isHeadquarters: true, id: { not: id } },
          data: { isHeadquarters: false },
        });
      }

      const data: Prisma.LocationUpdateInput = { ...body };
      const location = await prisma.location.update({ where: { id }, data });
      await writeAuditLog({
        tenantId: session.user.activeOrgId ?? "",
        actorProfileId: session.user.id,
        action: "location.updated",
        resourceType: "location",
        resourceId: id,
        metadata: { fields: Object.keys(body) },
      });
      return apiSuccess(location);
    } catch (e) {
      console.error("PATCH /api/locations/[id] error:", e);
      return apiError("Failed to update location", 500);
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
    { resource: "locations", action: "delete" },
    { current: session, organizationId: session.user.activeOrgId ?? "", routeId: "DELETE /api/locations/[id]" }
  );
  if (enforced instanceof Response) return enforced;

  const { id } = await params;
  return withTenant(session.user.activeOrgId ?? "", async () => {
    try {
      await prisma.location.delete({ where: { id } });
      await writeAuditLog({
        tenantId: session.user.activeOrgId ?? "",
        actorProfileId: session.user.id,
        action: "location.deleted",
        resourceType: "location",
        resourceId: id,
      });
      return apiSuccess({ deleted: true });
    } catch (e) {
      console.error("DELETE /api/locations/[id] error:", e);
      return apiError("Failed to delete location", 500);
    }
  });
}
