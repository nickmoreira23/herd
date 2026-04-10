import { prisma } from "@/lib/prisma";
import { UserTable } from "@/components/organization/user-table";
import { connection } from "next/server";

export default async function UsersPage() {
  await connection();
  const users = await prisma.networkProfile.findMany({
    include: {
      profileType: { select: { id: true, displayName: true, slug: true, color: true, networkType: true } },
      profileRoles: {
        include: { role: { select: { id: true, displayName: true, slug: true } } },
      },
      profileRanks: {
        where: { isCurrent: true },
        include: { rankTier: { select: { displayName: true, color: true, level: true } } },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const profileTypes = await prisma.networkProfileType.findMany({
    where: { isActive: true },
    orderBy: [{ networkType: "asc" }, { sortOrder: "asc" }],
    select: { id: true, displayName: true, slug: true, color: true, networkType: true },
  });

  const roles = await prisma.networkRole.findMany({
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true, slug: true, networkType: true },
  });

  return (
    <UserTable
      initialUsers={users}
      profileTypes={profileTypes}
      roles={roles}
    />
  );
}
