import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { createTierSchema } from "@/lib/validators/tier";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export async function GET() {
  try {
    // L1b.2a — Tier read scoped to the host org (inert until L1b.2b activation).
    const orgId = await getOrgIdFromRequest();
    const tiers = orgId
      ? await withTenant(orgId, () =>
          prisma.subscriptionTier.findMany({ orderBy: { sortOrder: "asc" } })
        )
      : [];
    return apiSuccess(tiers);
  } catch (e) {
    console.error("GET /api/tiers error:", e);
    return apiError("Failed to fetch tiers", 500);
  }
}

export async function POST(request: Request) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  // L1b.1 — Tier is becoming tenant-owned; stamp the host org so the row
  // satisfies the future NOT NULL. L1b.2a — reads/writes run under withTenant
  // (inert until L1b.2b activation; the slug check becomes per-tenant then).
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  try {
    const result = await parseAndValidate(request, createTierSchema);
    if ("error" in result) return result.error;

    return await withTenant(orgId, async () => {
      // findFirst (not findUnique): under the tenancy Extension the read filter
      // adds tenantId to the where, and slug becomes a per-tenant composite in
      // L1b.3 — findUnique on slug alone would break then. Mirrors the L1a.4 sku fix.
      const existing = await prisma.subscriptionTier.findFirst({
        where: { slug: result.data.slug },
      });
      if (existing) {
        return apiError("A tier with this slug already exists", 409);
      }

      const tier = await prisma.subscriptionTier.create({
        data: {
          ...result.data,
          tenantId: orgId,
          includedAIFeatures: result.data.includedAIFeatures || [],
          highlightFeatures: result.data.highlightFeatures || [],
        },
      });

      return apiSuccess(tier, 201);
    });
  } catch (e) {
    console.error("POST /api/tiers error:", e);
    return apiError("Failed to create tier", 500);
  }
}
