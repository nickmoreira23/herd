import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const source = await prisma.commissionPlan.findUnique({
      where: { id },
      include: {
        planRates: true,
        overrideRules: true,
        performanceTiers: true,
      },
    });

    if (!source) return apiError("Plan not found", 404);

    // Determine next version
    const latest = await prisma.commissionPlan.findMany({
      where: { name: source.name },
      orderBy: { version: "desc" },
      take: 1,
    });
    const nextVersion = latest[0].version + 1;

    // Create new version with all related records in a transaction
    const newPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.commissionPlan.create({
        data: {
          name: source.name,
          version: nextVersion,
          isActive: false,
          effectiveFrom: source.effectiveFrom,
          effectiveTo: source.effectiveTo,
          residualPercent: source.residualPercent,
          notes: `Duplicated from v${source.version}`,
        },
      });

      // Copy rates
      if (source.planRates.length > 0) {
        await Promise.all(
          source.planRates.map((r) =>
            tx.commissionPlanRate.create({
              data: {
                commissionPlanId: plan.id,
                subscriptionTierId: r.subscriptionTierId,
                roleType: r.roleType,
                upfrontBonus: r.upfrontBonus,
                residualPercent: r.residualPercent,
              },
            })
          )
        );
      }

      // Copy overrides
      if (source.overrideRules.length > 0) {
        await Promise.all(
          source.overrideRules.map((r) =>
            tx.overrideRule.create({
              data: {
                commissionPlanId: plan.id,
                roleType: r.roleType,
                overrideType: r.overrideType,
                overrideValue: r.overrideValue,
                notes: r.notes,
              },
            })
          )
        );
      }

      // Copy performance tiers
      if (source.performanceTiers.length > 0) {
        await Promise.all(
          source.performanceTiers.map((t) =>
            tx.performanceTier.create({
              data: {
                commissionPlanId: plan.id,
                label: t.label,
                minSales: t.minSales,
                maxSales: t.maxSales,
                bonusMultiplier: t.bonusMultiplier,
                bonusFlat: t.bonusFlat,
                sortOrder: t.sortOrder,
              },
            })
          )
        );
      }

      return plan;
    });

    return apiSuccess(newPlan, 201);
  } catch (e) {
    console.error("POST /api/commission-plans/[id]/duplicate error:", e);
    return apiError("Failed to duplicate plan", 500);
  }
}
