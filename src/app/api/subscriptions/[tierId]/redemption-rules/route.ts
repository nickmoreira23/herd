import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { createRedemptionRuleSchema } from "@/lib/validators/redemption-rule";
import { recalculateTierProductCosts } from "@/lib/recalculate-tier-costs";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

// GET: Fetch all redemption rules for a tier
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tierId: string }> }
) {
  const { tierId } = await params;
  try {
    const rules = await prisma.subscriptionRedemptionRule.findMany({
      where: { subscriptionTierId: tierId },
      orderBy: [{ redemptionType: "asc" }, { scopeType: "asc" }, { scopeValue: "asc" }],
    });
    return apiSuccess(rules);
  } catch (e) {
    console.error("GET redemption-rules error:", e);
    return apiError("Failed to fetch redemption rules", 500);
  }
}

// POST: Create a new redemption rule
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tierId: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  // L1a.4 — the cost recalculation reads the tenant-scoped catalog.
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  const { tierId } = await params;
  try {
    // Verify tier exists — L1b.2a scoped to host org (inert until L1b.2b).
    const tier = await withTenant(orgId, () =>
      prisma.subscriptionTier.findUnique({ where: { id: tierId } })
    );
    if (!tier) return apiError("Subscription tier not found", 404);

    const result = await parseAndValidate(request, createRedemptionRuleSchema);
    if ("error" in result) return result.error;

    const { redemptionType, discountPercent, scopeType, scopeValue } = result.data;

    // Check for duplicate
    const existing = await prisma.subscriptionRedemptionRule.findUnique({
      where: {
        subscriptionTierId_redemptionType_scopeType_scopeValue: {
          subscriptionTierId: tierId,
          redemptionType,
          scopeType,
          scopeValue,
        },
      },
    });
    if (existing) return apiError("This rule already exists for this tier", 409);

    const rule = await prisma.subscriptionRedemptionRule.create({
      data: {
        subscriptionTierId: tierId,
        redemptionType,
        discountPercent,
        scopeType,
        scopeValue,
      },
    });

    // Recalculate package product costs affected by this new rule
    const productsRecalculated = await recalculateTierProductCosts(tierId, orgId);

    return apiSuccess({ ...rule, productsRecalculated }, 201);
  } catch (e) {
    console.error("POST redemption-rules error:", e);
    return apiError("Failed to create redemption rule", 500);
  }
}
