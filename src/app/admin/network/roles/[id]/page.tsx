import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { RoleForm } from "@/components/network/roles/role-form"
import { RolePermissionMatrix } from "@/components/network/roles/role-permission-matrix"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft, Shield } from "lucide-react"
import { connection } from "next/server";

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection();
  const { id } = await params

  const [role, allRoles, permissions] = await Promise.all([
    prisma.networkRole.findUnique({
      where: { id },
      include: {
        parentRole: { select: { id: true, displayName: true } },
        rolePermissions: { select: { permissionId: true } },
      },
    }),
    prisma.networkRole.findMany({
      where: { id: { not: id } },
      select: { id: true, displayName: true, slug: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.networkPermission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    }),
  ])

  if (!role) notFound()

  const assignedPermissionIds = new Set<string>(role.rolePermissions.map((rp) => rp.permissionId))

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/network/roles"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Roles
      </Link>

      {/* Page header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">{role.displayName}</h1>
          <Badge variant="outline" className="px-1 py-1 text-xs font-mono">
            {role.slug}
          </Badge>
          {role.networkType && (
            <Badge variant="outline" className="px-1 py-1 text-xs">
              {role.networkType === "INTERNAL" ? "Internal" : "External"}
            </Badge>
          )}
          {role.isSystem && (
            <Badge variant="outline" className="px-1 py-1 text-xs border-amber-500/50 bg-amber-500/10 text-amber-500">
              System Role
            </Badge>
          )}
        </div>
        {role.description && (
          <p className="text-sm text-muted-foreground ml-8">{role.description}</p>
        )}
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="settings">
        <TabsList variant="line">
          <TabsTrigger value="settings">Role Settings</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="pt-6">
          <RoleForm
            mode="edit"
            roleId={id}
            isSystem={role.isSystem}
            availableParentRoles={allRoles}
            defaultValues={{
              displayName: role.displayName,
              slug: role.slug,
              description: role.description ?? undefined,
              networkType: role.networkType ?? undefined,
              parentRoleId: role.parentRoleId ?? undefined,
            }}
          />
        </TabsContent>

        <TabsContent value="permissions" className="pt-6">
          <RolePermissionMatrix
            roleId={id}
            permissions={permissions}
            assignedPermissionIds={assignedPermissionIds}
            isSystem={role.isSystem}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
