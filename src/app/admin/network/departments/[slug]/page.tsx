import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserTable } from "@/components/organization/user-table";

export default async function DepartmentMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;

  const department = await prisma.department.findFirst({
    where: { slug, networkType: "INTERNAL" },
    select: {
      id: true,
      name: true,
      description: true,
      members: { select: { profileId: true } },
    },
  });

  if (!department) notFound();

  const memberIds = department.members.map((m) => m.profileId);

  const users = await prisma.networkProfile.findMany({
    where: { id: { in: memberIds } },
    include: {
      profileType: {
        select: { id: true, displayName: true, slug: true, color: true, networkType: true },
      },
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{department.name}</h1>
        {department.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {department.description}
          </p>
        )}
      </div>
      <UserTable
        initialUsers={users}
        profileTypes={profileTypes}
        roles={roles}
      />
    </div>
  );
}
