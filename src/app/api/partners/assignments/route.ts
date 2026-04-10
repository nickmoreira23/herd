import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { batchTierAssignmentsSchema } from "@/lib/validators/partner";

export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, batchTierAssignmentsSchema);
    if ("error" in result) return result.error;

    const assignments = await Promise.all(
      result.data.assignments.map((a) =>
        prisma.partnerTierAssignment.upsert({
          where: {
            partnerBrandId_subscriptionTierId: {
              partnerBrandId: a.partnerBrandId,
              subscriptionTierId: a.subscriptionTierId,
            },
          },
          update: {
            discountPercent: a.discountPercent,
            isActive: a.isActive ?? true,
          },
          create: {
            partnerBrandId: a.partnerBrandId,
            subscriptionTierId: a.subscriptionTierId,
            discountPercent: a.discountPercent,
            isActive: a.isActive ?? true,
          },
        })
      )
    );

    return apiSuccess(assignments, 201);
  } catch (e) {
    console.error("POST /api/partners/assignments error:", e);
    return apiError("Failed to update tier assignments", 500);
  }
}
