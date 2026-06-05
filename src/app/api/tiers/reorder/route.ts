import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { reorderSchema } from "@/lib/validators/tier";

export async function POST(request: Request) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const result = await parseAndValidate(request, reorderSchema);
    if ("error" in result) return result.error;

    for (const item of result.data.items) {
      await prisma.subscriptionTier.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      });
    }

    return apiSuccess({ updated: result.data.items.length });
  } catch (e) {
    console.error("POST /api/tiers/reorder error:", e);
    return apiError("Failed to reorder tiers", 500);
  }
}
