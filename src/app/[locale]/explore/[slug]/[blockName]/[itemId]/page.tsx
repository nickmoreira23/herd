import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";
import { resolveItemDetail } from "@/lib/marketplace/item-detail-resolver";
import { MarketplaceItemDetail } from "@/components/marketplace/item-detail/marketplace-item-detail";
import { isSupportedLocale } from "@/lib/i18n/locales";

interface PageParams {
  locale: string;
  slug: string;
  blockName: string;
  itemId: string;
}

/**
 * Async island that does the dynamic DB work. Wrapped in <Suspense> by the
 * page component so Next 16 can stream the static shell first; otherwise the
 * prerenderer fails with "Uncached data was accessed outside of <Suspense>".
 */
async function ItemDetailContent({ params }: { params: PageParams }) {
  await connection();
  const { slug, blockName, itemId } = params;

  const orgId = await getOrgIdFromRequest();
  if (!orgId) notFound();

  // findFirst: slug is unique per tenant; RLS scopes to the host org.
  const section = await withTenant(orgId, () =>
    prisma.marketplaceSection.findFirst({
      where: { slug },
      select: { id: true, name: true, slug: true, status: true },
    })
  );
  if (!section || section.status !== "PUBLISHED") notFound();

  // L1a.2 — resolveItemDetail reads tenant-scoped Product; run under host org.
  const detail = await withTenant(orgId, () => resolveItemDetail(blockName, itemId));
  if (!detail) notFound();

  return (
    <MarketplaceItemDetail
      detail={detail}
      backHref={`/explore/${section.slug}`}
      backLabel={`Back to ${section.name}`}
    />
  );
}

function ItemDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-32 rounded bg-muted" />
      <div className="h-64 w-full rounded bg-muted" />
      <div className="h-4 w-2/3 rounded bg-muted" />
      <div className="h-4 w-1/2 rounded bg-muted" />
    </div>
  );
}

export default async function PublicItemDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolved = await params;
  if (!isSupportedLocale(resolved.locale)) notFound();

  return (
    <div className="max-w-6xl mx-auto px-6 pb-12">
      <Suspense fallback={<ItemDetailSkeleton />}>
        <ItemDetailContent params={resolved} />
      </Suspense>
    </div>
  );
}
