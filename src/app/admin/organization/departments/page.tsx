import { prisma } from "@/lib/prisma";
import { DepartmentTree } from "@/components/organization/department-tree";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function DepartmentsPage() {
  await connection();
  const session = await auth();
  const orgId =
    (await getOrgIdFromRequest()) ?? session?.user?.activeOrgId ?? null;

  // Tenant leak guard: never call withTenant("") — an empty GUC turns the
  // Extension into a no-op and the herd_app_full_access permissive policy would
  // re-expose all orgs. No active org → render empty.
  if (!orgId) {
    return <DepartmentTree initialDepartments={[]} profiles={[]} />;
  }

  const [departments, profiles] = await withTenant(orgId, () =>
    Promise.all([
      prisma.department.findMany({
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          head: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          children: { select: { id: true, name: true } },
          _count: { select: { members: true } },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.networkProfile.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { firstName: "asc" },
      }),
    ])
  );

  return (
    <DepartmentTree
      initialDepartments={departments}
      profiles={profiles}
    />
  );
}
