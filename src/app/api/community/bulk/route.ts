import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { z } from "zod";

const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid()),
  action: z.enum(["activate", "deactivate", "delete"]),
});

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = bulkActionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.message, 400);
    }

    const { ids, action } = parsed.data;

    if (action === "delete") {
      await prisma.communityBenefit.deleteMany({
        where: { id: { in: ids } },
      });
      return apiSuccess({ deleted: ids.length });
    }

    const newStatus = action === "activate" ? "ACTIVE" : "DRAFT";
    await prisma.communityBenefit.updateMany({
      where: { id: { in: ids } },
      data: { status: newStatus },
    });
    return apiSuccess({ updated: ids.length });
  } catch (e) {
    console.error("PATCH /api/community/bulk error:", e);
    return apiError("Failed to perform bulk action", 500);
  }
}
