import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createAgreementSchema } from "@/lib/validators/partner-agreement";

export async function GET() {
  try {
    const agreements = await prisma.partnerAgreement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        partner: true,
        commissionPlan: true,
        clawbackRules: { orderBy: { windowDays: "asc" } },
        _count: { select: { ledgerEntries: true } },
      },
    });
    return apiSuccess(agreements);
  } catch (e) {
    console.error("GET /api/partner-agreements error:", e);
    return apiError("Failed to fetch agreements", 500);
  }
}

export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, createAgreementSchema);
    if ("error" in result) return result.error;

    const agreement = await prisma.partnerAgreement.create({
      data: result.data,
      include: { partner: true, commissionPlan: true },
    });
    return apiSuccess(agreement, 201);
  } catch (e) {
    console.error("POST /api/partner-agreements error:", e);
    return apiError("Failed to create agreement", 500);
  }
}
