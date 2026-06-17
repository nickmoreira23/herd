import { blockRegistry } from "@/lib/blocks/registry";
import { money, type Money, type CurrencyCode } from "@/lib/money";
import type { ArtifactMeta } from "@/lib/chat/types";
import type { Listing } from "@prisma/client";

/**
 * L2b.1 — resolve a Listing into its rendered shape by reading the referenced
 * block record through the GENERIC path (blockRegistry → DataProvider →
 * getArtifactMeta), then layering the listing's own overrides on top. The block
 * is the source of truth; an override (present) wins, an absent override
 * inherits. A vanished block record yields `available: false` — never throws
 * (mirrors the item-detail notFound semantics). Must run under withTenant
 * (provider reads are tenant-scoped).
 */
export interface ResolvedListing {
  id: string;
  blockName: string;
  sourceId: string;
  /** false when the referenced block record no longer resolves (dangling ref). */
  available: boolean;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  /** Override price, else the block's price (Money), else null (block has none). */
  price: Money | null;
  /** True when `price` came from the listing's override (vs the block). */
  priceIsOverride: boolean;
  featured: boolean;
  sortOrder: number;
  status: Listing["status"];
}

/**
 * Generic block-record lookup by (blockName, sourceId). Resolves the
 * DataProvider from the block registry by matching types — the same mechanism
 * resolveGeneric uses — so it works for ANY block with a provider, not a
 * hard-coded switch. Returns null if the block/provider/record is absent.
 */
export async function resolveBlockRecordMeta(
  blockName: string,
  sourceId: string,
): Promise<ArtifactMeta | null> {
  const block = blockRegistry.get(blockName);
  if (!block || block.types.length === 0) return null;
  const { providers } = await import("@/lib/chat/data-retrieval");
  const provider = providers.find((p) => p.types.some((t) => block.types.includes(t)));
  if (!provider) return null;
  const metas = await provider.getArtifactMeta([sourceId]);
  return metas[0] ?? null;
}

/**
 * Derive a block record's price from its ArtifactMeta. Price is NOT on the
 * generic contract — providers that have one stuff it into `meta` (products use
 * `meta.retailPrice`, a JS-number dollars value). The block carries no currency
 * field, and the existing product UI renders USD, so USD is used here. Blocks
 * without a price → null. Documented best-effort by convention (retailPrice →
 * price), not a guaranteed contract.
 */
function blockPrice(meta: ArtifactMeta): Money | null {
  const raw = (meta.meta?.retailPrice ?? meta.meta?.price) as unknown;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return money(Math.round(raw * 100), "USD");
  }
  return null;
}

export async function resolveListing(listing: Listing): Promise<ResolvedListing> {
  const base = {
    id: listing.id,
    blockName: listing.blockName,
    sourceId: listing.sourceId,
    featured: listing.featured,
    sortOrder: listing.sortOrder,
    status: listing.status,
  };

  const overridePrice: Money | null =
    listing.priceOverrideCents !== null
      ? money(listing.priceOverrideCents, (listing.priceOverrideCurrency ?? "USD") as CurrencyCode)
      : null;

  const meta = await resolveBlockRecordMeta(listing.blockName, listing.sourceId);
  if (!meta) {
    // Dangling reference — block record gone. Surface overrides we still have,
    // mark unavailable; do not throw.
    return {
      ...base,
      available: false,
      title: listing.titleOverride ?? null,
      description: listing.descriptionOverride ?? null,
      imageUrl: listing.imageUrlOverride ?? null,
      price: overridePrice,
      priceIsOverride: overridePrice !== null,
    };
  }

  const derived = blockPrice(meta);
  return {
    ...base,
    available: true,
    title: listing.titleOverride ?? meta.name,
    description: listing.descriptionOverride ?? meta.description ?? null,
    imageUrl: listing.imageUrlOverride ?? meta.imageUrl ?? null,
    price: overridePrice ?? derived,
    priceIsOverride: overridePrice !== null,
  };
}
