import Link from "next/link"
import { Plus } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { RoleTable } from "@/components/network/roles/role-table"
import { connection } from "next/server";

export default async function RolesPage() {
  await connection();
  const roles = await prisma.networkRole.findMany({
    include: {
      parentRole: { select: { id: true, displayName: true } },
      _count: { select: { profileRoles: true } },
    },
    orderBy: { displayName: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground mt-1">Define roles, set permissions, and control access across your network.</p>
        </div>
        <Link
          href="/admin/network/roles/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Role
        </Link>
      </div>
      <RoleTable data={roles} />
    </div>
  )
}
