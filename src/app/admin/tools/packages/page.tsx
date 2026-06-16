import { prisma } from "@/lib/prisma";
import { PackagesClient } from "@/components/packages/packages-client";
import { connection } from "next/server";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function PackagesPage() {
  await connection();
  const packages = await prisma.package.findMany({
    orderBy: [{ fitnessGoal: "asc" }, { sortOrder: "asc" }],
    include: {
      variants: {
        include: {
          _count: { select: { products: true } },
        },
      },
    },
  });

  // L1b.2a — Tier joined in memory under the host org (Package family is not tenant-scoped).
  const orgId = await getOrgIdFromRequest();
  const tierIds = [
    ...new Set(packages.flatMap((pkg) => pkg.variants.map((v) => v.subscriptionTierId))),
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

  // Serialize Decimal fields
  const serialized = packages.map((pkg) => ({
    ...pkg,
    variants: pkg.variants.flatMap((v) => {
      const tier = tierById.get(v.subscriptionTierId);
      if (!tier) return [];
      return [
        {
          ...v,
          totalCreditsUsed: Number(v.totalCreditsUsed),
          subscriptionTier: {
            ...tier,
            monthlyCredits: Number(tier.monthlyCredits),
          },
        },
      ];
    }),
  }));

  return <PackagesClient initialPackages={serialized as never} />;
}
