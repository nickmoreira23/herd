import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils"
import { createRoleSchema } from "@/lib/validators/network-role"
// NetworkType will be available from @prisma/client after `prisma generate`
type NetworkType = "INTERNAL" | "EXTERNAL"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const networkType = searchParams.get("network_type") as NetworkType | null

    const roles = await prisma.networkRole.findMany({
      where: {
        ...(networkType && { networkType }),
      },
      include: {
        parentRole: { select: { id: true, displayName: true, slug: true } },
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: { select: { profileRoles: true } },
      },
      orderBy: { displayName: "asc" },
    })

    return apiSuccess(roles)
  } catch (error) {
    console.error("GET /api/network/roles", error)
    return apiError("Failed to fetch roles", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseAndValidate(request, createRoleSchema);
    if ("error" in result) return result.error;
    const { data } = result;

    const existing = await prisma.networkRole.findUnique({ where: { slug: data.slug } })
    if (existing) {
      return apiError("A role with this slug already exists", 409)
    }

    const role = await prisma.networkRole.create({
      data,
      include: {
        parentRole: { select: { id: true, displayName: true, slug: true } },
        _count: { select: { profileRoles: true } },
      },
    })

    return apiSuccess(role, 201)
  } catch (error) {
    console.error("POST /api/network/roles", error)
    return apiError("Failed to create role", 500)
  }
}
