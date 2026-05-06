import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { MarketplaceEmptyState } from "@/components/marketplace/marketplace-empty-state";

export default async function MarketplacePage() {
  await connection();

  const first = await prisma.marketplaceSection.findFirst({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true },
  });

  if (first) {
    redirect(`/admin/marketplace/sections/${first.id}`);
  }

  return <MarketplaceEmptyState />;
}
