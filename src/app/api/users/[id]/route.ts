import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.networkProfile.findUnique({
      where: { id },
      include: {
        profileType: { select: { id: true, displayName: true, slug: true, color: true, networkType: true } },
        profileRoles: {
          include: { role: { select: { id: true, displayName: true, slug: true } } },
        },
        profileRanks: {
          where: { isCurrent: true },
          include: { rankTier: { select: { displayName: true, color: true, level: true } } },
          take: 1,
        },
      },
    });
    if (!user) return apiError("User not found", 404);
    return apiSuccess(user);
  } catch (e) {
    console.error("GET /api/users/[id] error:", e);
    return apiError("Failed to fetch user", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Only allow updating certain fields
    const allowedFields: Record<string, unknown> = {};
    if (body.firstName !== undefined) allowedFields.firstName = body.firstName;
    if (body.lastName !== undefined) allowedFields.lastName = body.lastName;
    if (body.email !== undefined) allowedFields.email = body.email;
    if (body.phone !== undefined) allowedFields.phone = body.phone;
    if (body.status !== undefined) allowedFields.status = body.status;
    if (body.avatarUrl !== undefined) allowedFields.avatarUrl = body.avatarUrl;
    if (body.profileTypeId !== undefined) {
      allowedFields.profileTypeId = body.profileTypeId;
      // Also update networkType based on the new profile type
      const pt = await prisma.networkProfileType.findUnique({
        where: { id: body.profileTypeId },
      });
      if (pt) allowedFields.networkType = pt.networkType;
    }

    const user = await prisma.networkProfile.update({
      where: { id },
      data: allowedFields,
      include: {
        profileType: { select: { id: true, displayName: true, slug: true, color: true, networkType: true } },
        profileRoles: {
          include: { role: { select: { id: true, displayName: true, slug: true } } },
        },
      },
    });

    // Handle role updates if provided
    if (body.roleIds && Array.isArray(body.roleIds)) {
      // Remove existing roles and re-assign
      await prisma.networkProfileRole.deleteMany({ where: { profileId: id } });
      if (body.roleIds.length > 0) {
        await prisma.networkProfileRole.createMany({
          data: body.roleIds.map((roleId: string) => ({ profileId: id, roleId })),
        });
      }
    }

    return apiSuccess(user);
  } catch (e) {
    console.error("PATCH /api/users/[id] error:", e);
    return apiError("Failed to update user", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.networkProfile.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/users/[id] error:", e);
    return apiError("Failed to delete user", 500);
  }
}
