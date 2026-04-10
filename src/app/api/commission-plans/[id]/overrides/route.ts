import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { batchOverrideRulesSchema } from "@/lib/validators/override-rule";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rules = await prisma.overrideRule.findMany({
      where: { commissionPlanId: id },
    });
    return apiSuccess(rules);
  } catch (e) {
    console.error("GET /api/commission-plans/[id]/overrides error:", e);
    return apiError("Failed to fetch override rules", 500);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, batchOverrideRulesSchema);
    if ("error" in result) return result.error;

    const upserted = await Promise.all(
      result.data.rules.map((rule) =>
        prisma.overrideRule.upsert({
          where: {
            commissionPlanId_roleType: {
              commissionPlanId: id,
              roleType: rule.roleType,
            },
          },
          update: { overrideType: rule.overrideType, overrideValue: rule.overrideValue, notes: rule.notes },
          create: { commissionPlanId: id, ...rule },
        })
      )
    );
    return apiSuccess(upserted);
  } catch (e) {
    console.error("POST /api/commission-plans/[id]/overrides error:", e);
    return apiError("Failed to save override rules", 500);
  }
}
