import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateCommissionSchema } from "@/lib/validators/commission";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const structure = await prisma.commissionStructure.findUnique({
      where: { id },
      include: {
        tierRates: { include: { subscriptionTier: true } },
      },
    });
    if (!structure) return apiError("Commission structure not found", 404);
    return apiSuccess(structure);
  } catch (e) {
    console.error("GET /api/commissions/[id] error:", e);
    return apiError("Failed to fetch commission structure", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, updateCommissionSchema);
    if ("error" in result) return result.error;

    // If setting as active, deactivate all others first
    if (result.data.isActive) {
      await prisma.commissionStructure.updateMany({
        where: { id: { not: id } },
        data: { isActive: false },
      });
    }

    const structure = await prisma.commissionStructure.update({
      where: { id },
      data: result.data,
    });
    return apiSuccess(structure);
  } catch (e) {
    console.error("PATCH /api/commissions/[id] error:", e);
    return apiError("Failed to update commission structure", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.commissionStructure.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/commissions/[id] error:", e);
    return apiError("Failed to delete commission structure", 500);
  }
}
