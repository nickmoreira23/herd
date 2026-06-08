import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveItemDetail } from "@/lib/marketplace/item-detail-resolver";
import { MarketplaceItemDetail } from "@/components/marketplace/item-detail/marketplace-item-detail";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function AdminItemDetailPage({
  params,
}: {
  params: Promise<{ id: string; blockName: string; itemId: string }>;
}) {
  await connection();
  const { id: sectionId, blockName, itemId } = await params;

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/admin/marketplace");

  const section = await prisma.marketplaceSection.findUnique({
    where: { id: sectionId },
    select: { id: true, name: true },
  });
  if (!section) redirect("/admin/marketplace");

  // L1a.2 — resolveItemDetail reads tenant-scoped Product; run under host org.
  const detail = await withTenant(orgId, () => resolveItemDetail(blockName, itemId));
  if (!detail) redirect(`/admin/marketplace/sections/${sectionId}`);

  return (
    <div className="max-w-6xl mx-auto px-6 pb-12">
      <MarketplaceItemDetail
        detail={detail}
        backHref={`/admin/marketplace/sections/${sectionId}`}
        backLabel={`Back to ${section.name}`}
      />
    </div>
  );
}
