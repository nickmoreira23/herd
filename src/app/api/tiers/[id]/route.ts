import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { updateTierSchema } from "@/lib/validators/tier";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // L1b.2a — Tier read scoped to the host org (inert until L1b.2b activation).
    const orgId = await getOrgIdFromRequest();
    const tier = orgId
      ? await withTenant(orgId, () =>
          prisma.subscriptionTier.findUnique({
            where: { id },
            include: {
              pricingSnapshots: { orderBy: { createdAt: "desc" }, take: 50 },
            },
          })
        )
      : null;
    if (!tier) return apiError("Tier not found", 404);
    return apiSuccess(tier);
  } catch (e) {
    console.error("GET /api/tiers/[id] error:", e);
    return apiError("Failed to fetch tier", 500);
  }
}

const PRICE_FIELDS = ["monthlyPrice", "biannualPrice", "annualPrice"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  // L1b.2a — Tier reads/writes run under the host org (inert until L1b.2b).
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  try {
    const { id } = await params;
    const result = await parseAndValidate(request, updateTierSchema);
    if ("error" in result) return result.error;

    // Check if any price field changed — if so, snapshot before updating
    const hasPriceChange = PRICE_FIELDS.some((f) => result.data[f] !== undefined);

    if (hasPriceChange) {
      const current = await withTenant(orgId, () =>
        prisma.subscriptionTier.findUnique({ where: { id } })
      );
      if (current) {
        // TierPricingSnapshot is not tenant-scoped — create stays outside withTenant.
        await prisma.tierPricingSnapshot.create({
          data: {
            subscriptionTierId: id,
            monthlyPrice: current.monthlyPrice,
            biannualPrice: current.biannualPrice,
            annualPrice: current.annualPrice,
            changedBy: "admin",
          },
        });
      }
    }

    const tier = await withTenant(orgId, () =>
      prisma.subscriptionTier.update({
        where: { id },
        data: result.data,
      })
    );
    return apiSuccess(tier);
  } catch (e) {
    console.error("PATCH /api/tiers/[id] error:", e);
    return apiError("Failed to update tier", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  // L1b.2a — Tier delete scoped to the host org (inert until L1b.2b).
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  try {
    const { id } = await params;
    await withTenant(orgId, () => prisma.subscriptionTier.delete({ where: { id } }));
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/tiers/[id] error:", e);
    return apiError("Failed to delete tier", 500);
  }
}
