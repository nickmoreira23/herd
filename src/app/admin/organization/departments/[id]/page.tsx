import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DepartmentDetail } from "@/components/organization/department-detail";
import { connection } from "next/server";

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  const [department, allProfiles] = await Promise.all([
    prisma.department.findUnique({
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
                profileType: { select: { displayName: true, color: true } },
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    }),
    prisma.networkProfile.findMany({
      where: { networkType: "INTERNAL", status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  if (!department) notFound();

  return (
    <DepartmentDetail
      department={department}
      allProfiles={allProfiles}
    />
  );
}
