import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-utils";

export async function GET() {
  const profiles = await prisma.networkProfile.findMany({
    where: { networkType: "EXTERNAL" },
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
      profileRanks: {
        where: { isCurrent: true },
        include: { rankTier: { select: { displayName: true, color: true, level: true } } },
        take: 1,
      },
    },
    orderBy: { firstName: "asc" },
  });

  return apiSuccess({ profiles });
}
