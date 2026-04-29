import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveItemDetail } from "@/lib/marketplace/item-detail-resolver";
import { MarketplaceItemDetail } from "@/components/marketplace/item-detail/marketplace-item-detail";

export default async function PublicItemDetailPage({
  params,
}: {
  params: Promise<{ slug: string; blockName: string; itemId: string }>;
}) {
  await connection();
  const { slug, blockName, itemId } = await params;

  const section = await prisma.marketplaceSection.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, status: true },
  });
  if (!section || section.status !== "PUBLISHED") notFound();

  const detail = await resolveItemDetail(blockName, itemId);
  if (!detail) notFound();

  return (
    <div className="max-w-6xl mx-auto px-6 pb-12">
      <MarketplaceItemDetail
        detail={detail}
        backHref={`/explore/${section.slug}`}
        backLabel={`Back to ${section.name}`}
      />
    </div>
  );
}
