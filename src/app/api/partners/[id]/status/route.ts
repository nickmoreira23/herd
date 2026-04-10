import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { statusTransitionSchema } from "@/lib/validators/partner";

const VALID_TRANSITIONS: Record<string, string[]> = {
  RESEARCHED: ["APPLIED"],
  APPLIED: ["APPROVED", "RESEARCHED"],
  APPROVED: ["ACTIVE", "APPLIED"],
  ACTIVE: ["PAUSED"],
  PAUSED: ["ACTIVE"],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, statusTransitionSchema);
    if ("error" in result) return result.error;

    const partner = await prisma.partnerBrand.findUnique({ where: { id } });
    if (!partner) return apiError("Partner not found", 404);

    const currentStatus = partner.status;
    const newStatus = result.data.status;

    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      return apiError(
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(", ")}`,
        400
      );
    }

    const updated = await prisma.partnerBrand.update({
      where: { id },
      data: {
        status: newStatus,
        isActive: newStatus === "ACTIVE",
      },
    });

    return apiSuccess(updated);
  } catch (e) {
    console.error("PATCH /api/partners/[id]/status error:", e);
    return apiError("Failed to update partner status", 500);
  }
}
