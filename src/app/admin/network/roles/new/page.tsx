import { prisma } from "@/lib/prisma"
import { RoleForm } from "@/components/network/roles/role-form"

export default async function NewRolePage() {
  const roles = await prisma.networkRole.findMany({
    select: { id: true, displayName: true, slug: true },
    orderBy: { displayName: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Role</h1>
        <p className="text-sm text-muted-foreground mt-1">Create a new role with custom permissions.</p>
      </div>
      <RoleForm mode="create" availableParentRoles={roles} />
    </div>
  )
}
