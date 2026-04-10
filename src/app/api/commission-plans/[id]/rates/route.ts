import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { batchPlanRatesSchema } from "@/lib/validators/commission-plan";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rates = await prisma.commissionPlanRate.findMany({
      where: { commissionPlanId: id },
      include: { subscriptionTier: true },
    });
    return apiSuccess(rates);
  } catch (e) {
    console.error("GET /api/commission-plans/[id]/rates error:", e);
    return apiError("Failed to fetch plan rates", 500);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, batchPlanRatesSchema);
    if ("error" in result) return result.error;

    const upserted = await Promise.all(
      result.data.rates.map((rate) =>
        prisma.commissionPlanRate.upsert({
          where: {
            commissionPlanId_subscriptionTierId_roleType: {
              commissionPlanId: id,
              subscriptionTierId: rate.subscriptionTierId,
              roleType: rate.roleType,
            },
          },
          update: { upfrontBonus: rate.upfrontBonus, residualPercent: rate.residualPercent },
          create: { commissionPlanId: id, ...rate },
        })
      )
    );
    return apiSuccess(upserted);
  } catch (e) {
    console.error("POST /api/commission-plans/[id]/rates error:", e);
    return apiError("Failed to save plan rates", 500);
  }
}
