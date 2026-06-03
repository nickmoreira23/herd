import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";
import { MarketplaceEmptyState } from "@/components/marketplace/marketplace-empty-state";

export default async function MarketplacePage() {
  await connection();

  const orgId = await getOrgIdFromRequest();
  if (!orgId) return <MarketplaceEmptyState />;

  const first = await withTenant(orgId, () =>
    prisma.marketplaceSection.findFirst({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true },
    })
  );

  if (first) {
    redirect(`/admin/marketplace/sections/${first.id}`);
  }

  return <MarketplaceEmptyState />;
}
