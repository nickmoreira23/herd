import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { z } from "zod";

const updateSchema = z.object({
  assignments: z.array(
    z.object({
      communityBenefitId: z.string().uuid(),
      isEnabled: z.boolean(),
    })
  ),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await prisma.communityBenefitTierAssignment.findMany({
      where: { subscriptionTierId: id },
      include: {
        communityBenefit: {
          select: {
            id: true,
            name: true,
            key: true,
            description: true,
            icon: true,
            platform: true,
            status: true,
          },
        },
      },
      orderBy: { communityBenefit: { sortOrder: "asc" } },
    });
    return apiSuccess(rows);
  } catch (e) {
    console.error("GET /api/tiers/[id]/community error:", e);
    return apiError("Failed to fetch tier community benefits", 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return apiError(result.error.issues[0]?.message || "Invalid input", 400);
    }

    const { assignments } = result.data;

    await prisma.$transaction(async (tx) => {
      // Remove all existing assignments for this tier
      await tx.communityBenefitTierAssignment.deleteMany({
        where: { subscriptionTierId: id },
      });

      // Create new assignments (only enabled ones)
      const enabled = assignments.filter((a) => a.isEnabled);
      if (enabled.length > 0) {
        await tx.communityBenefitTierAssignment.createMany({
          data: enabled.map((a) => ({
            communityBenefitId: a.communityBenefitId,
            subscriptionTierId: id,
            isEnabled: true,
          })),
        });
      }
    });

    const updated = await prisma.communityBenefitTierAssignment.findMany({
      where: { subscriptionTierId: id },
      include: {
        communityBenefit: {
          select: {
            id: true,
            name: true,
            key: true,
            description: true,
            icon: true,
            platform: true,
            status: true,
          },
        },
      },
      orderBy: { communityBenefit: { sortOrder: "asc" } },
    });

    return apiSuccess(updated);
  } catch (e) {
    console.error("PUT /api/tiers/[id]/community error:", e);
    return apiError("Failed to update tier community benefits", 500);
  }
}
