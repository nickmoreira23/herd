import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { reorderSchema } from "@/lib/validators/tier";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export async function POST(request: Request) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  // L1b.2a — Tier writes scoped to the host org (inert until L1b.2b).
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  try {
    const result = await parseAndValidate(request, reorderSchema);
    if ("error" in result) return result.error;

    await withTenant(orgId, async () => {
      for (const item of result.data.items) {
        await prisma.subscriptionTier.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        });
      }
    });

    return apiSuccess({ updated: result.data.items.length });
  } catch (e) {
    console.error("POST /api/tiers/reorder error:", e);
    return apiError("Failed to reorder tiers", 500);
  }
}
