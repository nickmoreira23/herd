import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiSuccess, apiError } from "@/lib/api-utils"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const profile = await prisma.networkProfile.findUnique({
      where: { id },
      include: {
        profileType: true,
        parent: { select: { id: true, firstName: true, lastName: true, email: true } },
        profileRoles: { include: { role: true } },
        profileRanks: {
          where: { isCurrent: true },
          include: { rankTier: true },
          take: 1,
        },
        attributes: true,
        compensations: {
          where: { effectiveTo: null },
          include: { compPlan: true },
          take: 1,
        },
        teamMemberships: { include: { team: { select: { id: true, name: true } } } },
      },
    })

    if (!profile) {
      return apiError("Profile not found", 404)
    }

    return apiSuccess(profile)
  } catch (error) {
    console.error("GET /api/network/profiles/[id]", error)
    return apiError("Failed to fetch profile", 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.networkProfile.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!existing) {
      return apiError("Profile not found", 404)
    }

    const updated = await prisma.networkProfile.update({
      where: { id },
      data: {
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
        ...(body.status !== undefined && { status: body.status }),
      },
      include: {
        profileType: { select: { id: true, displayName: true } },
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    console.error("PUT /api/network/profiles/[id]", error)
    return apiError("Failed to update profile", 500)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await prisma.networkProfile.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!existing) {
      return apiError("Profile not found", 404)
    }

    const terminated = await prisma.networkProfile.update({
      where: { id },
      data: { status: "TERMINATED" },
    })

    return apiSuccess(terminated)
  } catch (error) {
    console.error("DELETE /api/network/profiles/[id]", error)
    return apiError("Failed to terminate profile", 500)
  }
}
