import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateAgreementSchema } from "@/lib/validators/partner-agreement";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const agreement = await prisma.partnerAgreement.findUnique({
      where: { id },
      include: {
        partner: true,
        commissionPlan: { include: { planRates: true, overrideRules: true, performanceTiers: true } },
        clawbackRules: { orderBy: { windowDays: "asc" } },
      },
    });
    if (!agreement) return apiError("Agreement not found", 404);
    return apiSuccess(agreement);
  } catch (e) {
    console.error("GET /api/partner-agreements/[id] error:", e);
    return apiError("Failed to fetch agreement", 500);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, updateAgreementSchema);
    if ("error" in result) return result.error;

    const agreement = await prisma.partnerAgreement.update({
      where: { id },
      data: result.data,
      include: { partner: true, commissionPlan: true },
    });
    return apiSuccess(agreement);
  } catch (e) {
    console.error("PATCH /api/partner-agreements/[id] error:", e);
    return apiError("Failed to update agreement", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.partnerAgreement.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/partner-agreements/[id] error:", e);
    return apiError("Failed to delete agreement", 500);
  }
}
