import { prisma } from "@/lib/prisma";
import { DepartmentTree } from "@/components/organization/department-tree";

export default async function DepartmentsPage() {
  const [departments, profiles] = await Promise.all([
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
      where: { networkType: "INTERNAL", status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  return (
    <DepartmentTree
      initialDepartments={departments}
      profiles={profiles}
    />
  );
}
