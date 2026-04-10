import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updatePartnerSchema } from "@/lib/validators/partner";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partner = await prisma.partnerBrand.findUnique({
      where: { id },
      include: {
        tierAssignments: {
          include: { tier: true },
        },
      },
    });
    if (!partner) return apiError("Partner not found", 404);
    return apiSuccess(partner);
  } catch (e) {
    console.error("GET /api/partners/[id] error:", e);
    return apiError("Failed to fetch partner", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, updatePartnerSchema);
    if ("error" in result) return result.error;

    const partner = await prisma.partnerBrand.update({
      where: { id },
      data: result.data,
    });
    return apiSuccess(partner);
  } catch (e) {
    console.error("PATCH /api/partners/[id] error:", e);
    return apiError("Failed to update partner", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.partnerBrand.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/partners/[id] error:", e);
    return apiError("Failed to delete partner", 500);
  }
}
