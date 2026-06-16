import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createPackageSchema } from "@/lib/validators/package";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export async function GET(request: Request) {
  // L1b.2a — Tier joined in memory under the host org (Package family is not tenant-scoped).
  const orgId = await getOrgIdFromRequest();

  try {
    const { searchParams } = new URL(request.url);
    const goal = searchParams.get("goal");

    const packages = await prisma.package.findMany({
      where: goal ? { fitnessGoal: goal as never } : undefined,
      orderBy: [{ fitnessGoal: "asc" }, { sortOrder: "asc" }],
      include: {
        variants: {
          include: {
            _count: { select: { products: true } },
          },
        },
      },
    });

    const tierIds = [
      ...new Set(packages.flatMap((p) => p.variants.map((v) => v.subscriptionTierId))),
    ];
    const tiers = orgId
      ? await withTenant(orgId, () =>
          prisma.subscriptionTier.findMany({
            where: { id: { in: tierIds } },
            select: { id: true, name: true, monthlyCredits: true },
          })
        )
      : [];
    const tierById = new Map(tiers.map((t) => [t.id, t]));

    const joined = packages.map((p) => ({
      ...p,
      variants: p.variants.flatMap((v) => {
        const subscriptionTier = tierById.get(v.subscriptionTierId);
        return subscriptionTier ? [{ ...v, subscriptionTier }] : [];
      }),
    }));

    return apiSuccess(joined);
  } catch (e) {
    console.error("GET /api/packages error:", e);
    return apiError("Failed to fetch packages", 500);
  }
}

export async function POST(request: Request) {
  // L1b.2a — Tier joined in memory under the host org (Package family is not tenant-scoped).
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  try {
    const result = await parseAndValidate(request, createPackageSchema);
    if ("error" in result) return result.error;

    const existing = await prisma.package.findUnique({
      where: { slug: result.data.slug },
    });
    if (existing) {
      return apiError("A package with this slug already exists", 409);
    }

    // Get all active tiers to auto-scaffold variants
    const activeTiers = await withTenant(orgId, () =>
      prisma.subscriptionTier.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
        orderBy: { sortOrder: "asc" },
      })
    );

    const pkg = await prisma.package.create({
      data: {
        ...result.data,
        variants: {
          create: activeTiers.map((tier) => ({
            subscriptionTierId: tier.id,
          })),
        },
      },
      include: {
        variants: true,
      },
    });

    const tierIds = pkg.variants.map((v) => v.subscriptionTierId);
    const tiers = await withTenant(orgId, () =>
      prisma.subscriptionTier.findMany({
        where: { id: { in: tierIds } },
        select: { id: true, name: true, monthlyCredits: true },
      })
    );
    const tierById = new Map(tiers.map((t) => [t.id, t]));

    const joined = {
      ...pkg,
      variants: pkg.variants.flatMap((v) => {
        const subscriptionTier = tierById.get(v.subscriptionTierId);
        return subscriptionTier ? [{ ...v, subscriptionTier }] : [];
      }),
    };

    return apiSuccess(joined, 201);
  } catch (e) {
    console.error("POST /api/packages error:", e);
    return apiError("Failed to create package", 500);
  }
}
