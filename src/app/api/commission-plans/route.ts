import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createCommissionPlanSchema } from "@/lib/validators/commission-plan";

export async function GET() {
  try {
    const plans = await prisma.commissionPlan.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: {
        planRates: { include: { subscriptionTier: true } },
        overrideRules: true,
        performanceTiers: { orderBy: { sortOrder: "asc" } },
        _count: { select: { agreements: true } },
      },
    });
    return apiSuccess(plans);
  } catch (e) {
    console.error("GET /api/commission-plans error:", e);
    return apiError("Failed to fetch commission plans", 500);
  }
}

export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, createCommissionPlanSchema);
    if ("error" in result) return result.error;

    // If setting as active, deactivate all others first
    if (result.data.isActive) {
      await prisma.commissionPlan.updateMany({ data: { isActive: false } });
    }

    // Determine version number
    const existing = await prisma.commissionPlan.findMany({
      where: { name: result.data.name },
      orderBy: { version: "desc" },
      take: 1,
    });
    const version = existing.length > 0 ? existing[0].version + 1 : 1;

    const plan = await prisma.commissionPlan.create({
      data: { ...result.data, version },
    });
    return apiSuccess(plan, 201);
  } catch (e) {
    console.error("POST /api/commission-plans error:", e);
    return apiError("Failed to create commission plan", 500);
  }
}
