import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";
import { resolveItemDetail, type ItemDetail } from "@/lib/marketplace/item-detail-resolver";
import { resolveListing } from "@/lib/marketplace/listing-resolver";
import type { Money } from "@/lib/money";
import { MarketplaceItemDetail } from "@/components/marketplace/item-detail/marketplace-item-detail";
import { isSupportedLocale } from "@/lib/i18n/locales";

/** L2b.2 — overlay a curated Listing's overrides onto the block-derived detail. */
function applyListingOverlay(
  detail: ItemDetail,
  overrides: { title: string | null; description: string | null; imageUrl: string | null; price: Money | null },
  locale: string,
): ItemDetail {
  const gallery = overrides.imageUrl
    ? [{ url: overrides.imageUrl, alt: overrides.title ?? detail.name, isPrimary: true }, ...detail.gallery]
    : detail.gallery;
  let primaryFacts = detail.primaryFacts;
  if (overrides.price) {
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: overrides.price.currency,
    }).format(Number(overrides.price.amountCents) / 100);
    // Curated price replaces the block's price facts.
    primaryFacts = [
      { label: "Price", value: formatted },
      ...detail.primaryFacts.filter((f) => !/price/i.test(f.label)),
    ];
  }
  return {
    ...detail,
    name: overrides.title ?? detail.name,
    description: overrides.description ?? detail.description,
    gallery,
    primaryFacts,
  };
}

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
  const { locale, slug, blockName, itemId } = params;

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

  // L2b.2 — is this a CURATED item (a Listing) in the section?
  const listing = await withTenant(orgId, () =>
    prisma.listing.findFirst({
      where: { sectionId: section.id, blockName, sourceId: itemId },
    })
  );

  // L1a.2 — resolveItemDetail reads tenant-scoped Product; run under host org.
  let detail = await withTenant(orgId, () => resolveItemDetail(blockName, itemId));

  if (listing) {
    const resolved = await withTenant(orgId, () => resolveListing(listing));
    if (!resolved.available) notFound(); // dangling curated item → unavailable
    if (detail) detail = applyListingOverlay(detail, resolved, locale);
  }

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
