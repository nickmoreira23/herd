import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { withTenant } from "@/lib/tenancy/context";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const { id } = await params;
  return withTenant(session.user.activeOrgId ?? "", async () => {
    try {
      const body = await request.json();
      const { profileId, title } = body;

      if (!profileId) return apiError("profileId is required");

      const member = await prisma.departmentMember.create({
        data: {
          departmentId: id,
          profileId,
          title: title || null,
        },
        include: {
          profile: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      await writeAuditLog({
        tenantId: session.user.activeOrgId ?? "",
        actorProfileId: session.user.id,
        action: "department.member_changed",
        resourceType: "department",
        resourceId: id,
        metadata: { change: "added", profileId, title: title || null },
      });

      return apiSuccess(member, 201);
    } catch {
      return apiError("Failed to add member", 500);
    }
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const { id } = await params;
  return withTenant(session.user.activeOrgId ?? "", async () => {
    try {
      const body = await request.json();
      const { profileId } = body;

      if (!profileId) return apiError("profileId is required");

      await prisma.departmentMember.delete({
        where: {
          departmentId_profileId: { departmentId: id, profileId },
        },
      });

      await writeAuditLog({
        tenantId: session.user.activeOrgId ?? "",
        actorProfileId: session.user.id,
        action: "department.member_changed",
        resourceType: "department",
        resourceId: id,
        metadata: { change: "removed", profileId },
      });

      return apiSuccess({ removed: true });
    } catch {
      return apiError("Failed to remove member", 500);
    }
  });
}
