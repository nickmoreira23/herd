import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { createTierSchema } from "@/lib/validators/tier";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";

export async function GET() {
  try {
    const tiers = await prisma.subscriptionTier.findMany({
      orderBy: { sortOrder: "asc" },
    });
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
  // satisfies the future NOT NULL. Full withTenant wiring is L1b.2.
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  try {
    const result = await parseAndValidate(request, createTierSchema);
    if ("error" in result) return result.error;

    const existing = await prisma.subscriptionTier.findUnique({
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
  } catch (e) {
    console.error("POST /api/tiers error:", e);
    return apiError("Failed to create tier", 500);
  }
}
