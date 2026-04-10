import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiSuccess, apiError } from "@/lib/api-utils"

// POST -- assign a permission to a role
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await params
    const { permissionId } = await request.json()

    if (!permissionId) {
      return apiError("permissionId is required", 422)
    }

    const role = await prisma.networkRole.findUnique({ where: { id: roleId } })
    if (!role) {
      return apiError("Role not found", 404)
    }

    const permission = await prisma.networkPermission.findUnique({ where: { id: permissionId } })
    if (!permission) {
      return apiError("Permission not found", 404)
    }

    await prisma.networkRolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    })

    return apiSuccess({ roleId, permissionId })
  } catch (error) {
    console.error("POST /api/network/roles/[id]/permissions", error)
    return apiError("Failed to assign permission", 500)
  }
}

// DELETE -- revoke a permission from a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await params
    const { permissionId } = await request.json()

    if (!permissionId) {
      return apiError("permissionId is required", 422)
    }

    await prisma.networkRolePermission.deleteMany({
      where: { roleId, permissionId },
    })

    return apiSuccess({ roleId, permissionId })
  } catch (error) {
    console.error("DELETE /api/network/roles/[id]/permissions", error)
    return apiError("Failed to revoke permission", 500)
  }
}
