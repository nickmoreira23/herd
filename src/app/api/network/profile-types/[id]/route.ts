import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateProfileTypeSchema } from "@/lib/validators/network-profile-type";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const profileType = await prisma.networkProfileType.findUnique({
      where: { id },
      include: {
        _count: { select: { profiles: true } },
      },
    });

    if (!profileType) {
      return apiError("Profile type not found", 404);
    }

    return apiSuccess({ ...profileType, canDelete: profileType._count.profiles === 0 });
  } catch (error) {
    console.error("GET /api/network/profile-types/[id]", error);
    return apiError("Failed to fetch profile type", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await parseAndValidate(request, updateProfileTypeSchema);
    if ("error" in result) return result.error;
    const { data } = result;

    const existing = await prisma.networkProfileType.findUnique({ where: { id } });
    if (!existing) {
      return apiError("Profile type not found", 404);
    }

    const updated = await prisma.networkProfileType.update({
      where: { id },
      data: {
        ...data,
        ...(data.wizardFields && {
          wizardFields: data.wizardFields as object[],
        }),
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("PUT /api/network/profile-types/[id]", error);
    return apiError("Failed to update profile type", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const profileType = await prisma.networkProfileType.findUnique({
      where: { id },
      include: { _count: { select: { profiles: true } } },
    });

    if (!profileType) {
      return apiError("Profile type not found", 404);
    }

    if (profileType._count.profiles > 0) {
      return apiError(
        `Cannot delete: ${profileType._count.profiles} profile(s) use this type. Deactivate instead.`,
        409
      );
    }

    await prisma.networkProfileType.update({
      where: { id },
      data: { isActive: false },
    });

    return apiSuccess({ id });
  } catch (error) {
    console.error("DELETE /api/network/profile-types/[id]", error);
    return apiError("Failed to delete profile type", 500);
  }
}
