import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { batchTierRatesSchema } from "@/lib/validators/commission";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, batchTierRatesSchema);
    if ("error" in result) return result.error;

    // Delete existing rates and recreate
    await prisma.commissionTierRate.deleteMany({
      where: { commissionStructureId: id },
    });

    const rates = await Promise.all(
      result.data.rates.map((rate) =>
        prisma.commissionTierRate.create({
          data: {
            commissionStructureId: id,
            ...rate,
          },
        })
      )
    );

    return apiSuccess(rates, 201);
  } catch (e) {
    console.error("POST /api/commissions/[id]/rates error:", e);
    return apiError("Failed to update tier rates", 500);
  }
}
