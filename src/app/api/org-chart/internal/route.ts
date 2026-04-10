import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-utils";

export async function GET() {
  const [profiles, departments] = await Promise.all([
    prisma.networkProfile.findMany({
      where: { networkType: "INTERNAL" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        status: true,
        parentId: true,
        profileType: { select: { id: true, displayName: true, color: true } },
        profileRoles: { include: { role: { select: { displayName: true } } } },
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
}
