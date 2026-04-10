import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { agentTierAccessSchema } from "@/lib/validators/agent";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await prisma.agentTierAccess.findMany({
      where: { subscriptionTierId: id },
      include: {
        agent: {
          select: { id: true, name: true, key: true, category: true, icon: true, description: true },
        },
      },
      orderBy: { agent: { sortOrder: "asc" } },
    });
    return apiSuccess(rows);
  } catch (e) {
    console.error("GET /api/tiers/[id]/agents error:", e);
    return apiError("Failed to fetch tier agents", 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, agentTierAccessSchema);
    if ("error" in result) return result.error;

    const { assignments } = result.data;

    await prisma.$transaction(async (tx) => {
      // Remove all existing assignments for this tier
      await tx.agentTierAccess.deleteMany({
        where: { subscriptionTierId: id },
      });

      // Create new assignments
      if (assignments.length > 0) {
        await tx.agentTierAccess.createMany({
          data: assignments.map((a) => ({
            agentId: a.agentId,
            subscriptionTierId: id,
            isEnabled: a.isEnabled,
            dailyUsageLimitOverride: a.dailyUsageLimitOverride ?? null,
            priorityAccess: a.priorityAccess ?? false,
          })),
        });
      }
    });

    // Return the updated assignments
    const updated = await prisma.agentTierAccess.findMany({
      where: { subscriptionTierId: id },
      include: {
        agent: {
          select: { id: true, name: true, key: true, category: true, icon: true, description: true },
        },
      },
      orderBy: { agent: { sortOrder: "asc" } },
    });

    return apiSuccess(updated);
  } catch (e) {
    console.error("PUT /api/tiers/[id]/agents error:", e);
    return apiError("Failed to update tier agents", 500);
  }
}
