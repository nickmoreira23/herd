import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-utils";
import { requireOrgRole, enforceRoute } from "@/lib/permissions";
import { withTenant } from "@/lib/tenancy/context";

export async function GET() {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN", "MEMBER"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const enforced = await enforceRoute(
    session,
    { resource: "org_hierarchy", action: "read" },
    { current: session, organizationId: session.user.activeOrgId ?? "", routeId: "GET /api/org-chart/internal" }
  );
  if (enforced instanceof Response) return enforced;

  return withTenant(session.user.activeOrgId ?? "", async () => {
    // NetworkProfile.networkType + parentId + profileType dropped in
    // Sub-etapa 3.6. Profile filter is now all profiles; Department.networkType
    // preserved (used to filter "internal" departments).
    // Sequential (not Promise.all): department.findMany is tenant-scoped, so the
    // Extension wraps it in a $transaction — running it concurrently with the
    // profile query collides on the pg connection (DeprecationWarning, pg@9).
    const profiles = await prisma.networkProfile.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        status: true,
        departmentMemberships: {
          include: {
            department: { select: { id: true, name: true, color: true } },
          },
        },
      },
      orderBy: { firstName: "asc" },
    });
    const departments = await prisma.department.findMany({
      where: { networkType: "INTERNAL" },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        headId: true,
        color: true,
        _count: { select: { members: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return apiSuccess({ profiles, departments });
  });
}
