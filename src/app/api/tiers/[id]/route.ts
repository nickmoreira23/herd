import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateTierSchema } from "@/lib/validators/tier";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tier = await prisma.subscriptionTier.findUnique({
      where: { id },
      include: {
        commissionTierRates: { include: { commissionStructure: true } },
        partnerAssignments: { include: { partner: true } },
        pricingSnapshots: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    if (!tier) return apiError("Tier not found", 404);
    return apiSuccess(tier);
  } catch (e) {
    console.error("GET /api/tiers/[id] error:", e);
    return apiError("Failed to fetch tier", 500);
  }
}

const PRICE_FIELDS = ["monthlyPrice", "quarterlyPrice", "annualPrice"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, updateTierSchema);
    if ("error" in result) return result.error;

    // Check if any price field changed — if so, snapshot before updating
    const hasPriceChange = PRICE_FIELDS.some((f) => result.data[f] !== undefined);

    if (hasPriceChange) {
      const current = await prisma.subscriptionTier.findUnique({ where: { id } });
      if (current) {
        await prisma.tierPricingSnapshot.create({
          data: {
            subscriptionTierId: id,
            monthlyPrice: current.monthlyPrice,
            quarterlyPrice: current.quarterlyPrice,
            annualPrice: current.annualPrice,
            changedBy: "admin",
          },
        });
      }
    }

    const tier = await prisma.subscriptionTier.update({
      where: { id },
      data: result.data,
    });
    return apiSuccess(tier);
  } catch (e) {
    console.error("PATCH /api/tiers/[id] error:", e);
    return apiError("Failed to update tier", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.subscriptionTier.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/tiers/[id] error:", e);
    return apiError("Failed to delete tier", 500);
  }
}
