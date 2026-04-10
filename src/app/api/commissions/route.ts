import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createCommissionSchema } from "@/lib/validators/commission";

export async function GET() {
  try {
    const structures = await prisma.commissionStructure.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        tierRates: {
          include: { subscriptionTier: true },
        },
      },
    });
    return apiSuccess(structures);
  } catch (e) {
    console.error("GET /api/commissions error:", e);
    return apiError("Failed to fetch commission structures", 500);
  }
}

export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, createCommissionSchema);
    if ("error" in result) return result.error;

    // If setting as active, deactivate all others first
    if (result.data.isActive) {
      await prisma.commissionStructure.updateMany({
        data: { isActive: false },
      });
    }

    const structure = await prisma.commissionStructure.create({
      data: result.data,
    });

    return apiSuccess(structure, 201);
  } catch (e) {
    console.error("POST /api/commissions error:", e);
    return apiError("Failed to create commission structure", 500);
  }
}
