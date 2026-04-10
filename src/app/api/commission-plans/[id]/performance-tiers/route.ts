import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { batchPerformanceTiersSchema } from "@/lib/validators/performance-tier";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tiers = await prisma.performanceTier.findMany({
      where: { commissionPlanId: id },
      orderBy: { sortOrder: "asc" },
    });
    return apiSuccess(tiers);
  } catch (e) {
    console.error("GET /api/commission-plans/[id]/performance-tiers error:", e);
    return apiError("Failed to fetch performance tiers", 500);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, batchPerformanceTiersSchema);
    if ("error" in result) return result.error;

    // Delete existing and replace (simpler than upsert for ordered list)
    await prisma.performanceTier.deleteMany({ where: { commissionPlanId: id } });

    const created = await Promise.all(
      result.data.tiers.map((tier, idx) =>
        prisma.performanceTier.create({
          data: { commissionPlanId: id, ...tier, sortOrder: tier.sortOrder ?? idx },
        })
      )
    );
    return apiSuccess(created);
  } catch (e) {
    console.error("POST /api/commission-plans/[id]/performance-tiers error:", e);
    return apiError("Failed to save performance tiers", 500);
  }
}
