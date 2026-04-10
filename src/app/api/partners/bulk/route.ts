import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { z } from "zod";

const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid()),
  action: z.enum(["delete"]),
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
      await prisma.partnerBrand.deleteMany({
        where: { id: { in: ids } },
      });
      return apiSuccess({ deleted: ids.length });
    }

    return apiError("Unknown action", 400);
  } catch (e) {
    console.error("PATCH /api/partners/bulk error:", e);
    return apiError("Failed to perform bulk action", 500);
  }
}
