import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateCommissionPlanSchema } from "@/lib/validators/commission-plan";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const plan = await prisma.commissionPlan.findUnique({
      where: { id },
      include: {
        planRates: { include: { subscriptionTier: true } },
        overrideRules: true,
        performanceTiers: { orderBy: { sortOrder: "asc" } },
        agreements: { include: { partner: true } },
      },
    });
    if (!plan) return apiError("Plan not found", 404);
    return apiSuccess(plan);
  } catch (e) {
    console.error("GET /api/commission-plans/[id] error:", e);
    return apiError("Failed to fetch plan", 500);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, updateCommissionPlanSchema);
    if ("error" in result) return result.error;

    if (result.data.isActive) {
      await prisma.commissionPlan.updateMany({
        where: { id: { not: id } },
        data: { isActive: false },
      });
    }

    const plan = await prisma.commissionPlan.update({ where: { id }, data: result.data });
    return apiSuccess(plan);
  } catch (e) {
    console.error("PATCH /api/commission-plans/[id] error:", e);
    return apiError("Failed to update plan", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.commissionPlan.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/commission-plans/[id] error:", e);
    return apiError("Failed to delete plan", 500);
  }
}
