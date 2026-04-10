import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createTierSchema } from "@/lib/validators/tier";

export async function GET() {
  try {
    const tiers = await prisma.subscriptionTier.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        commissionTierRates: {
          include: { commissionStructure: true },
        },
        partnerAssignments: {
          include: { partner: true },
        },
      },
    });
    return apiSuccess(tiers);
  } catch (e) {
    console.error("GET /api/tiers error:", e);
    return apiError("Failed to fetch tiers", 500);
  }
}

export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, createTierSchema);
    if ("error" in result) return result.error;

    const existing = await prisma.subscriptionTier.findUnique({
      where: { slug: result.data.slug },
    });
    if (existing) {
      return apiError("A tier with this slug already exists", 409);
    }

    const tier = await prisma.subscriptionTier.create({
      data: {
        ...result.data,
        includedAIFeatures: result.data.includedAIFeatures || [],
        highlightFeatures: result.data.highlightFeatures || [],
      },
    });

    return apiSuccess(tier, 201);
  } catch (e) {
    console.error("POST /api/tiers error:", e);
    return apiError("Failed to create tier", 500);
  }
}
