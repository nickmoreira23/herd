import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

const reorderSchema = z.object({
  orders: z
    .array(
      z.object({
        id: z.string().uuid(),
        sortOrder: z.coerce.number().int().nonnegative(),
      })
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  const result = await parseAndValidate(request, reorderSchema);
  if ("error" in result) return result.error;

  return withTenant(orgId, async () => {
    try {
      // Sequential updates (not prisma.$transaction): tenant-scoped ops are each
      // wrapped by the Extension in their own SET-LOCAL transaction. RLS clamps
      // every update to the host org — ids from another tenant match nothing.
      for (const o of result.data.orders) {
        await prisma.marketplaceSection.update({
          where: { id: o.id },
          data: { sortOrder: o.sortOrder },
        });
      }

      revalidatePath("/admin/marketplace");
      revalidatePath("/explore");
      return apiSuccess({ updated: result.data.orders.length });
    } catch (e) {
      console.error("POST /api/marketplace/sections/reorder error:", e);
      return apiError("Failed to reorder sections", 500);
    }
  });
}
