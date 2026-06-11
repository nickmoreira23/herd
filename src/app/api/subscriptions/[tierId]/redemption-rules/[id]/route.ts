import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { updateRedemptionRuleSchema } from "@/lib/validators/redemption-rule";
import { recalculateTierProductCosts } from "@/lib/recalculate-tier-costs";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";

// PATCH: Update discount percent on a rule
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tierId: string; id: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  // L1a.4 — the cost recalculation reads the tenant-scoped catalog.
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  const { tierId, id } = await params;
  try {
    const existing = await prisma.subscriptionRedemptionRule.findFirst({
      where: { id, subscriptionTierId: tierId },
    });
    if (!existing) return apiError("Redemption rule not found", 404);

    const result = await parseAndValidate(request, updateRedemptionRuleSchema);
    if ("error" in result) return result.error;

    const rule = await prisma.subscriptionRedemptionRule.update({
      where: { id },
      data: { discountPercent: result.data.discountPercent },
    });

    // Recalculate package product costs affected by this rule change
    const productsRecalculated = await recalculateTierProductCosts(tierId, orgId);

    return apiSuccess({ ...rule, productsRecalculated });
  } catch (e) {
    console.error("PATCH redemption-rule error:", e);
    return apiError("Failed to update redemption rule", 500);
  }
}

// DELETE: Remove a rule
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tierId: string; id: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  // L1a.4 — the cost recalculation reads the tenant-scoped catalog.
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  const { tierId, id } = await params;
  try {
    const existing = await prisma.subscriptionRedemptionRule.findFirst({
      where: { id, subscriptionTierId: tierId },
    });
    if (!existing) return apiError("Redemption rule not found", 404);

    await prisma.subscriptionRedemptionRule.delete({ where: { id } });

    // Recalculate package product costs after rule removal
    const productsRecalculated = await recalculateTierProductCosts(tierId, orgId);

    return apiSuccess({ deleted: true, productsRecalculated });
  } catch (e) {
    console.error("DELETE redemption-rule error:", e);
    return apiError("Failed to delete redemption rule", 500);
  }
}
