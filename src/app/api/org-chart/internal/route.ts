import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { withTenant } from "@/lib/tenancy/context";

export async function GET() {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN", "MEMBER"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  return withTenant(session.user.activeOrgId ?? "", async () => {
    // NetworkProfile.networkType + parentId + profileType dropped in
    // Sub-etapa 3.6. Profile filter is now all profiles; Department.networkType
    // preserved (used to filter "internal" departments).
    const [profiles, departments] = await Promise.all([
      prisma.networkProfile.findMany({
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
      }),
      prisma.department.findMany({
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
      }),
    ]);

    return apiSuccess({ profiles, departments });
  });
}
