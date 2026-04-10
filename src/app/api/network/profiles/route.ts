import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils"
import { createNetworkProfileSchema } from "@/lib/validators/network-profile"
import type { NetworkType, ProfileStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const networkType = searchParams.get("network_type") as NetworkType | null
    const profileTypeId = searchParams.get("profile_type_id")
    const status = searchParams.get("status") as ProfileStatus | null
    const search = searchParams.get("search")
    const checkEmail = searchParams.get("check_email")
    const page = parseInt(searchParams.get("page") ?? "1")
    const limit = parseInt(searchParams.get("limit") ?? "50")

    // Email uniqueness check for wizard step 2
    if (checkEmail) {
      const exists = await prisma.networkProfile.findUnique({
        where: { email: checkEmail },
        select: { id: true },
      })
      return apiSuccess({ exists: !!exists })
    }

    const profiles = await prisma.networkProfile.findMany({
      where: {
        ...(networkType && { networkType }),
        ...(profileTypeId && { profileTypeId }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      },
      include: {
        profileType: { select: { id: true, displayName: true, networkType: true, color: true } },
        profileRanks: {
          where: { isCurrent: true },
          include: { rankTier: { select: { displayName: true, color: true, level: true } } },
          take: 1,
        },
        parent: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    })

    const total = await prisma.networkProfile.count({
      where: {
        ...(networkType && { networkType }),
        ...(profileTypeId && { profileTypeId }),
        ...(status && { status }),
      },
    })

    return apiSuccess({ profiles, total, page, limit })
  } catch (error) {
    console.error("GET /api/network/profiles", error)
    return apiError("Failed to fetch profiles", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseAndValidate(request, createNetworkProfileSchema);
    if ("error" in result) return result.error;
    const { data } = result;

    // Check email uniqueness
    const emailExists = await prisma.networkProfile.findUnique({
      where: { email: data.email },
      select: { id: true },
    })
    if (emailExists) {
      return apiError("A profile with this email already exists", 409)
    }

    // Verify profile type exists
    const profileType = await prisma.networkProfileType.findUnique({
      where: { id: data.profileTypeId },
    })
    if (!profileType) {
      return apiError("Profile type not found", 404)
    }

    // Run everything in a transaction
    const profile = await prisma.$transaction(async (tx) => {
      // 1. Create the profile
      const newProfile = await tx.networkProfile.create({
        data: {
          networkType: data.networkType,
          profileTypeId: data.profileTypeId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          avatarUrl: data.avatarUrl,
          parentId: data.parentId,
          status: "ACTIVE",
        },
      })

      // 2. Insert closure table self-reference (depth 0)
      await tx.networkProfileHierarchyPath.create({
        data: {
          ancestorId: newProfile.id,
          descendantId: newProfile.id,
          depth: 0,
        },
      })

      // 3. Copy ancestor paths from parent (if exists)
      if (data.parentId) {
        const parentPaths = await tx.networkProfileHierarchyPath.findMany({
          where: { descendantId: data.parentId },
        })
        if (parentPaths.length > 0) {
          await tx.networkProfileHierarchyPath.createMany({
            data: parentPaths.map((path) => ({
              ancestorId: path.ancestorId,
              descendantId: newProfile.id,
              depth: path.depth + 1,
            })),
            skipDuplicates: true,
          })
        }
      }

      // 4. Assign roles
      const roleIds = data.roleIds ?? [];
      if (roleIds.length > 0) {
        await tx.networkProfileRole.createMany({
          data: roleIds.map((roleId) => ({
            profileId: newProfile.id,
            roleId,
          })),
          skipDuplicates: true,
        })
      }

      // 5. Team memberships
      const teamIds = data.teamIds ?? [];
      if (teamIds.length > 0) {
        await tx.networkTeamMember.createMany({
          data: teamIds.map((teamId) => ({
            teamId,
            profileId: newProfile.id,
          })),
          skipDuplicates: true,
        })
      }

      // 6. Compensation plan (external only)
      if (data.networkType === "EXTERNAL" && data.compensationPlanId) {
        await tx.networkProfileCompensation.create({
          data: {
            profileId: newProfile.id,
            compPlanId: data.compensationPlanId,
            effectiveFrom: new Date(),
          },
        })
      }

      // 7. Initial rank assignment (external -- default to Bronze)
      if (data.networkType === "EXTERNAL") {
        const bronzeRank = await tx.rankTier.findFirst({
          where: { slug: "bronze" },
        })
        if (bronzeRank) {
          await tx.networkProfileRank.create({
            data: {
              profileId: newProfile.id,
              rankTierId: bronzeRank.id,
              isCurrent: true,
              qualifyingMetrics: {},
            },
          })
        }
      }

      // 8. Store profile attributes
      const attrs = data.attributes as Record<string, unknown>
      if (Object.keys(attrs).length > 0) {
        await tx.networkProfileAttribute.createMany({
          data: Object.entries(attrs).map(([key, val]) => ({
            profileId: newProfile.id,
            attributeKey: key,
            attributeValue: val as object,
          })),
          skipDuplicates: true,
        })
      }

      return newProfile
    })

    // Return with relations
    const fullProfile = await prisma.networkProfile.findUnique({
      where: { id: profile.id },
      include: {
        profileType: { select: { id: true, displayName: true, networkType: true } },
        profileRanks: {
          where: { isCurrent: true },
          include: { rankTier: true },
          take: 1,
        },
      },
    })

    return apiSuccess(fullProfile, 201)
  } catch (error) {
    console.error("POST /api/network/profiles", error)
    return apiError("Failed to create profile", 500)
  }
}
