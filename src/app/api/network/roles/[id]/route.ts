import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils"
import { updateRoleSchema } from "@/lib/validators/network-role"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const role = await prisma.networkRole.findUnique({
      where: { id },
      include: {
        parentRole: { select: { id: true, displayName: true, slug: true } },
        childRoles: { select: { id: true, displayName: true, slug: true } },
        rolePermissions: { include: { permission: true } },
        _count: { select: { profileRoles: true } },
      },
    })

    if (!role) {
      return apiError("Role not found", 404)
    }

    return apiSuccess(role)
  } catch (error) {
    console.error("GET /api/network/roles/[id]", error)
    return apiError("Failed to fetch role", 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await parseAndValidate(request, updateRoleSchema);
    if ("error" in result) return result.error;
    const { data } = result;

    const existing = await prisma.networkRole.findUnique({ where: { id } })
    if (!existing) {
      return apiError("Role not found", 404)
    }

    const role = await prisma.networkRole.update({
      where: { id },
      data,
      include: {
        parentRole: { select: { id: true, displayName: true, slug: true } },
        _count: { select: { profileRoles: true } },
      },
    })

    return apiSuccess(role)
  } catch (error) {
    console.error("PUT /api/network/roles/[id]", error)
    return apiError("Failed to update role", 500)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const role = await prisma.networkRole.findUnique({
      where: { id },
      include: { _count: { select: { profileRoles: true } } },
    })

    if (!role) {
      return apiError("Role not found", 404)
    }

    if (role.isSystem) {
      return apiError("System roles cannot be deleted", 403)
    }

    if (role._count.profileRoles > 0) {
      return apiError(
        `Cannot delete: ${role._count.profileRoles} profile(s) have this role assigned.`,
        409
      )
    }

    await prisma.networkRole.delete({ where: { id } })
    return apiSuccess({ id })
  } catch (error) {
    console.error("DELETE /api/network/roles/[id]", error)
    return apiError("Failed to delete role", 500)
  }
}
