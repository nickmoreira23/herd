import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createD2DPartnerSchema } from "@/lib/validators/d2d-partner";

export async function GET() {
  try {
    const partners = await prisma.d2DPartner.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orgNodes: { orderBy: { createdAt: "asc" } },
        agreements: { include: { commissionPlan: true } },
        _count: { select: { orgNodes: true, agreements: true } },
      },
    });
    return apiSuccess(partners);
  } catch (e) {
    console.error("GET /api/d2d-partners error:", e);
    return apiError("Failed to fetch D2D partners", 500);
  }
}

export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, createD2DPartnerSchema);
    if ("error" in result) return result.error;

    const partner = await prisma.d2DPartner.create({ data: result.data });
    return apiSuccess(partner, 201);
  } catch (e) {
    console.error("POST /api/d2d-partners error:", e);
    return apiError("Failed to create D2D partner", 500);
  }
}
