import { providers as dataProviders } from "@/lib/chat/data-retrieval";
import { blockRegistry } from "@/lib/blocks/registry";
import { prisma } from "@/lib/prisma";
import type { ArtifactMeta } from "@/lib/chat/types";
import type { MarketplaceSection, MarketplaceSectionScope, MemberRole } from "@prisma/client";
import { MarketplaceScopeType } from "@prisma/client";
import {
  applyFilters,
  applySearch,
  buildFacets,
  getFilterFields,
  type Facet,
} from "./block-filters";
import { slugify } from "@/lib/slug";
import { resolveBlockRecordMeta } from "./listing-resolver";
import type { Listing } from "@prisma/client";

/** Initial number of items rendered server-side per items grid. */
export const INITIAL_ITEMS_PAGE_SIZE = 24;
/** Hard cap when the client requests a larger page. */
export const MAX_ITEMS_PAGE_SIZE = 48;

export interface RenderItem extends ArtifactMeta {
  blockName: string;
  // L2b.2 — set when this item came from a curated Listing (not an auto scope):
  // `featured`/`listingSortOrder` drive ordering; their presence marks curation.
  featured?: boolean;
  listingSortOrder?: number;
}

/**
 * L2a.2b-4b — a taxonomy strip entry, sourced from the materialized
 * Category/Subcategory entities (declared taxonomy, incl. zero-item ones).
 * `key` is the stable slug (carried in ?category= / ?subCategory= and matched
 * by the resolver + facet filter); `label` is the entity's editable name;
 * `count` is how many resolved items slug-match this key.
 */
export interface TaxonomyEntry {
  key: string;
  label: string;
  count: number;
}

export interface RenderContext {
  /** First-page items per block, ordered by id for paging stability. */
  itemsByBlock: Record<string, RenderItem[]>;
  hasMoreByBlock: Record<string, boolean>;
  totalByBlock: Record<string, number>;
  categoriesByBlock: Record<string, TaxonomyEntry[]>;
  subCategoriesByBlock: Record<string, TaxonomyEntry[]>;
  facetsByBlock: Record<string, Facet[]>;
}

/** Minimal viewer shape the scope gating needs (subset of ViewerContext). */
export interface ScopeViewer {
  isSuperAdmin: boolean;
  roles: MemberRole[];
}

/**
 * SE5a — internal RBAC visibility. A scope is visible to the viewer when:
 *  - the viewer is super_admin (sees everything), OR
 *  - the scope is unrestricted (empty allowedRoles), OR
 *  - the viewer holds at least one of the scope's allowedRoles.
 * Anonymous viewers carry roles=[] → only unrestricted scopes match.
 * Shared by render-resolver and the /explore index (no duplicated logic).
 */
export function scopeMatchesViewer(
  scope: Pick<MarketplaceSectionScope, "allowedRoles">,
  viewer: ScopeViewer
): boolean {
  if (viewer.isSuperAdmin) return true;
  if (scope.allowedRoles.length === 0) return true;
  return viewer.roles.some((r) => scope.allowedRoles.includes(r));
}

function itemMatchesScope(item: RenderItem, scope: MarketplaceSectionScope): boolean {
  switch (scope.scopeType) {
    case MarketplaceScopeType.ALL:
      return true;
    // L2a.2b — scopeValue holds the stable taxonomy slug (#39); normalize the
    // item's raw category/subcategory with the canonical slugify to compare.
    case MarketplaceScopeType.CATEGORY:
      return scope.scopeValue && item.category
        ? slugify(item.category) === scope.scopeValue
        : false;
    case MarketplaceScopeType.SUB_CATEGORY: {
      const sub = (item.meta as Record<string, unknown>)?.subCategory;
      return scope.scopeValue && typeof sub === "string" && sub
        ? slugify(sub) === scope.scopeValue
        : false;
    }
    // L2b.2 (Option A, #42) — ITEM is deprecated: a "specific item in a section"
    // is now a Listing (curated, with own data), merged in loadBlockItems. The
    // enum value is kept (no fragile enum drop) but no longer matches anything.
    case MarketplaceScopeType.ITEM:
    default:
      return false;
  }
}

/** Strip the "type:" prefix from a RenderItem id → the bare record id (sourceId). */
function rawIdOf(item: RenderItem): string {
  const colon = item.id.indexOf(":");
  return colon === -1 ? item.id : item.id.slice(colon + 1);
}

/**
 * L2b.2 — project a curated Listing into a RenderItem: the block record (via the
 * generic getArtifactMeta path) with the listing's display overrides on top.
 * A dangling listing (block record gone) returns null → not shown in the grid
 * (the detail page surfaces "unavailable" separately).
 */
async function listingToRenderItem(listing: Listing): Promise<RenderItem | null> {
  const meta = await resolveBlockRecordMeta(listing.blockName, listing.sourceId);
  if (!meta) return null;
  return {
    ...meta,
    blockName: listing.blockName,
    name: listing.titleOverride ?? meta.name,
    description: listing.descriptionOverride ?? meta.description ?? null,
    imageUrl: listing.imageUrlOverride ?? meta.imageUrl ?? null,
    featured: listing.featured,
    listingSortOrder: listing.sortOrder,
  };
}

/**
 * L2b.2 — a block's items in a section come from TWO sources, combined:
 *  (a) AUTOMATIC scopes (ALL/CATEGORY/SUB_CATEGORY) — raw block records matched
 *      by scope (slug-match, L2a), and
 *  (b) curated LISTINGS of the section — resolved with their overrides.
 * Dedupe by the bare record id: a Listing WINS over the same record arriving via
 * an automatic scope (curation overrides the raw item). Curated/featured items
 * sort first, then by the listing's sortOrder, then by id (stable paging). Must
 * run under withTenant (provider + listing reads are tenant-scoped).
 */
async function loadBlockItems(
  section: MarketplaceSection & { scopes: MarketplaceSectionScope[] },
  blockName: string,
  viewer: ScopeViewer
): Promise<RenderItem[]> {
  const block = blockRegistry.get(blockName);
  if (!block) return [];
  const allowedTypes = new Set(block.types);

  // Automatic scopes (ITEM is deprecated → effectively ALL/CATEGORY/SUB_CATEGORY).
  const scopes = section.scopes
    .filter((s) => s.blockName === blockName)
    .filter((s) => scopeMatchesViewer(s, viewer));

  // Curated listings for this section+block (visible to any viewer of the section).
  const listings = await prisma.listing.findMany({
    where: { sectionId: section.id, blockName },
  });

  if (scopes.length === 0 && listings.length === 0) return [];

  // (a) Automatic-scope items — only fetch the catalog if there are auto scopes.
  let autoItems: RenderItem[] = [];
  if (scopes.length > 0) {
    const candidates: RenderItem[] = [];
    for (const provider of dataProviders) {
      if (!provider.types.some((t) => allowedTypes.has(t))) continue;
      const catalog = await provider.getCatalogItems();
      const ids: string[] = [];
      for (const c of catalog) {
        if (!allowedTypes.has(c.type)) continue;
        const colon = c.id.indexOf(":");
        ids.push(colon === -1 ? c.id : c.id.slice(colon + 1));
      }
      if (ids.length === 0) continue;
      const metas = await provider.getArtifactMeta(ids);
      for (const m of metas) candidates.push({ ...m, blockName });
    }
    autoItems = candidates.filter((item) => scopes.some((s) => itemMatchesScope(item, s)));
  }

  // (b) Curated listing items (overrides applied; dangling → skipped).
  const listingItems: RenderItem[] = [];
  for (const l of listings) {
    const ri = await listingToRenderItem(l);
    if (ri) listingItems.push(ri);
  }

  // Merge: dedupe by bare record id; the Listing wins over the auto-scope item.
  const byRawId = new Map<string, RenderItem>();
  for (const item of autoItems) byRawId.set(rawIdOf(item), item);
  for (const item of listingItems) byRawId.set(rawIdOf(item), item);

  const merged = [...byRawId.values()];
  merged.sort((a, b) => {
    const af = a.featured ? 1 : 0;
    const bf = b.featured ? 1 : 0;
    if (af !== bf) return bf - af; // featured curated items first
    const aso = a.listingSortOrder ?? Number.MAX_SAFE_INTEGER;
    const bso = b.listingSortOrder ?? Number.MAX_SAFE_INTEGER;
    if (aso !== bso) return aso - bso; // then by listing sortOrder
    return a.id.localeCompare(b.id); // then stable by id (paging)
  });
  return merged;
}

/**
 * Page slice of items for a single block, optionally search/filtered.
 * Used by both the initial server render (page 0) and the load-more API.
 */
export async function resolveItemsPage(
  section: MarketplaceSection & { scopes: MarketplaceSectionScope[] },
  blockName: string,
  viewer: ScopeViewer,
  {
    offset,
    limit,
    query = "",
    filters = {},
  }: {
    offset: number;
    limit: number;
    query?: string;
    filters?: Record<string, string[]>;
  }
): Promise<{ items: RenderItem[]; total: number; hasMore: boolean }> {
  const all = await loadBlockItems(section, blockName, viewer);
  const fields = getFilterFields(blockName);
  const filtered = all
    .filter((item) => applySearch(item, query))
    .filter((item) => applyFilters(item, filters, fields));
  const cleanLimit = Math.min(Math.max(1, limit), MAX_ITEMS_PAGE_SIZE);
  const cleanOffset = Math.max(0, offset);
  const slice = filtered.slice(cleanOffset, cleanOffset + cleanLimit);
  return {
    items: slice,
    total: filtered.length,
    hasMore: cleanOffset + slice.length < filtered.length,
  };
}

/**
 * Distinct facet values + counts for a section/block, used by the items
 * grid filter UI. Built off the *full* (post-scope) item set so filter
 * options remain stable as the user paginates.
 */
export async function resolveBlockFacets(
  section: MarketplaceSection & { scopes: MarketplaceSectionScope[] },
  blockName: string,
  viewer: ScopeViewer
): Promise<{ facets: Facet[]; total: number }> {
  const all = await loadBlockItems(section, blockName, viewer);
  const fields = getFilterFields(blockName);
  return { facets: buildFacets(all, fields), total: all.length };
}

/**
 * Build the render context for a section: initial-page items per block
 * plus categories/sub-categories aggregated from the *full* set so
 * filter strips don't shrink as the user paginates.
 */
export async function buildRenderContext(
  section: MarketplaceSection & { scopes: MarketplaceSectionScope[] },
  viewer: ScopeViewer
): Promise<RenderContext> {
  const ctx: RenderContext = {
    itemsByBlock: {},
    hasMoreByBlock: {},
    totalByBlock: {},
    categoriesByBlock: {},
    subCategoriesByBlock: {},
    facetsByBlock: {},
  };

  // L2b.2 — blocks come from auto scopes AND from curated listings (a block may
  // appear via listings only, with no automatic scope).
  const listingBlocks = await prisma.listing.findMany({
    where: { sectionId: section.id },
    select: { blockName: true },
    distinct: ["blockName"],
  });
  const blockNames = Array.from(
    new Set([
      ...section.scopes
        .filter((s) => scopeMatchesViewer(s, viewer))
        .map((s) => s.blockName),
      ...listingBlocks.map((l) => l.blockName),
    ])
  );

  for (const blockName of blockNames) {
    const all = await loadBlockItems(section, blockName, viewer);
    ctx.totalByBlock[blockName] = all.length;
    const initial = all.slice(0, INITIAL_ITEMS_PAGE_SIZE);
    ctx.itemsByBlock[blockName] = initial;
    ctx.hasMoreByBlock[blockName] = all.length > initial.length;

    // L2a.2b-4b — taxonomy strips + facets come from the materialized
    // Category/Subcategory entities (declared taxonomy, incl. zero-item ones),
    // with counts computed by slug-matching the resolved items. Non-taxonomy
    // facets (status/brand/type) still come from the items via buildFacets.
    const taxonomy = await buildTaxonomy(blockName, all);
    ctx.categoriesByBlock[blockName] = taxonomy.categories;
    ctx.subCategoriesByBlock[blockName] = taxonomy.subCategories;
    ctx.facetsByBlock[blockName] = [
      ...taxonomy.facets,
      ...buildFacets(all, getFilterFields(blockName)),
    ];
  }

  return ctx;
}

/**
 * Build the taxonomy strips + facets for a block from its materialized
 * Category/Subcategory entities (tenant-scoped; must run under withTenant).
 * Counts come from slug-matching the resolved items. A flat block (no entities)
 * yields empty strips/facets — the pre-L2a.2b behavior for taxonomy-less blocks.
 */
async function buildTaxonomy(
  blockName: string,
  items: RenderItem[],
): Promise<{ categories: TaxonomyEntry[]; subCategories: TaxonomyEntry[]; facets: Facet[] }> {
  const entities = await prisma.category.findMany({
    where: { blockName },
    orderBy: { sortOrder: "asc" },
    include: { subcategories: { orderBy: { sortOrder: "asc" } } },
  });
  if (entities.length === 0) {
    return { categories: [], subCategories: [], facets: [] };
  }

  // Pre-count items by their slugified category / subcategory.
  const catCounts = new Map<string, number>();
  const subCounts = new Map<string, number>();
  for (const it of items) {
    if (it.category) {
      const k = slugify(it.category);
      catCounts.set(k, (catCounts.get(k) ?? 0) + 1);
    }
    const sub = (it.meta as Record<string, unknown>)?.subCategory;
    if (typeof sub === "string" && sub) {
      const k = slugify(sub);
      subCounts.set(k, (subCounts.get(k) ?? 0) + 1);
    }
  }

  const categories: TaxonomyEntry[] = entities.map((c) => ({
    key: c.sourceKey,
    label: c.name,
    count: catCounts.get(c.sourceKey) ?? 0,
  }));
  const subCategories: TaxonomyEntry[] = entities
    .flatMap((c) => c.subcategories)
    .map((s) => ({ key: s.sourceKey, label: s.name, count: subCounts.get(s.sourceKey) ?? 0 }));

  const facets: Facet[] = [];
  if (categories.length > 0) {
    facets.push({
      key: "category",
      label: "Category",
      options: categories.map((c) => ({ value: c.key, label: c.label, count: c.count })),
    });
  }
  if (subCategories.length > 0) {
    facets.push({
      key: "subCategory",
      label: "Sub-category",
      options: subCategories.map((s) => ({ value: s.key, label: s.label, count: s.count })),
    });
  }

  return { categories, subCategories, facets };
}
