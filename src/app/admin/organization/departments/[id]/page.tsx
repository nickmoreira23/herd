import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DepartmentDetail } from "@/components/organization/department-detail";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  const session = await auth();
  const orgId =
    (await getOrgIdFromRequest()) ?? session?.user?.activeOrgId ?? null;
  // Tenant leak guard: no active org → 404 (never withTenant("")).
  if (!orgId) notFound();

  const [department, allProfiles] = await withTenant(orgId, () =>
    Promise.all([
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
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    }),
    prisma.networkProfile.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: "asc" },
    }),
    ])
  );

  if (!department) notFound();

  return (
    <DepartmentDetail
      department={department as never}
      allProfiles={allProfiles}
    />
  );
}
