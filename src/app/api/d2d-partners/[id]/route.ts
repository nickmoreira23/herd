import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateD2DPartnerSchema } from "@/lib/validators/d2d-partner";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const partner = await prisma.d2DPartner.findUnique({
      where: { id },
      include: {
        orgNodes: { orderBy: { createdAt: "asc" } },
        agreements: { include: { commissionPlan: true, clawbackRules: true } },
      },
    });
    if (!partner) return apiError("Partner not found", 404);
    return apiSuccess(partner);
  } catch (e) {
    console.error("GET /api/d2d-partners/[id] error:", e);
    return apiError("Failed to fetch partner", 500);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, updateD2DPartnerSchema);
    if ("error" in result) return result.error;

    const partner = await prisma.d2DPartner.update({ where: { id }, data: result.data });
    return apiSuccess(partner);
  } catch (e) {
    console.error("PATCH /api/d2d-partners/[id] error:", e);
    return apiError("Failed to update partner", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.d2DPartner.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/d2d-partners/[id] error:", e);
    return apiError("Failed to delete partner", 500);
  }
}
