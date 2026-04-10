import { prisma } from "@/lib/prisma";
import { PackagesClient } from "@/components/packages/packages-client";
import { connection } from "next/server";

export default async function PackagesPage() {
  await connection();
  const packages = await prisma.package.findMany({
    orderBy: [{ fitnessGoal: "asc" }, { sortOrder: "asc" }],
    include: {
      variants: {
        include: {
          subscriptionTier: {
            select: { id: true, name: true, monthlyCredits: true },
          },
          _count: { select: { products: true } },
        },
      },
    },
  });

  // Serialize Decimal fields
  const serialized = packages.map((pkg) => ({
    ...pkg,
    variants: pkg.variants.map((v) => ({
      ...v,
      totalCreditsUsed: Number(v.totalCreditsUsed),
      subscriptionTier: {
        ...v.subscriptionTier,
        monthlyCredits: Number(v.subscriptionTier.monthlyCredits),
      },
    })),
  }));

  return <PackagesClient initialPackages={serialized as never} />;
}
