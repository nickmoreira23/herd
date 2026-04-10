import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateCommunityBenefitSchema } from "@/lib/validators/community";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const benefit = await prisma.communityBenefit.findUnique({
      where: { id },
      include: {
        tierAssignments: {
          include: {
            tier: {
              select: { name: true },
            },
          },
        },
      },
    });
    if (!benefit) return apiError("Community benefit not found", 404);
    return apiSuccess(benefit);
  } catch (e) {
    console.error("GET /api/community/[id] error:", e);
    return apiError("Failed to fetch community benefit", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, updateCommunityBenefitSchema);
    if ("error" in result) return result.error;

    const benefit = await prisma.communityBenefit.update({
      where: { id },
      data: result.data,
    });

    return apiSuccess(benefit);
  } catch (e) {
    console.error("PATCH /api/community/[id] error:", e);
    return apiError("Failed to update community benefit", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.communityBenefit.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/community/[id] error:", e);
    return apiError("Failed to delete community benefit", 500);
  }
}
