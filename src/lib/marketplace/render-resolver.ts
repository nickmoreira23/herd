import { providers as dataProviders } from "@/lib/chat/data-retrieval";
import { blockRegistry } from "@/lib/blocks/registry";
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

/** Initial number of items rendered server-side per items grid. */
export const INITIAL_ITEMS_PAGE_SIZE = 24;
/** Hard cap when the client requests a larger page. */
export const MAX_ITEMS_PAGE_SIZE = 48;

export interface RenderItem extends ArtifactMeta {
  blockName: string;
}

export interface RenderContext {
  /** First-page items per block, ordered by id for paging stability. */
  itemsByBlock: Record<string, RenderItem[]>;
  hasMoreByBlock: Record<string, boolean>;
  totalByBlock: Record<string, number>;
  categoriesByBlock: Record<string, string[]>;
  subCategoriesByBlock: Record<string, string[]>;
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
    case MarketplaceScopeType.CATEGORY:
      return scope.scopeValue ? item.category === scope.scopeValue : false;
    case MarketplaceScopeType.SUB_CATEGORY: {
      const sub = (item.meta as Record<string, unknown>)?.subCategory;
      return sub === scope.scopeValue;
    }
    case MarketplaceScopeType.ITEM: {
      const colon = item.id.indexOf(":");
      const rawId = colon === -1 ? item.id : item.id.slice(colon + 1);
      return rawId === scope.scopeValue;
    }
    default:
      return false;
  }
}

/** Pull every candidate item for the block, then filter by scopes the
 *  viewer is allowed to see. Returns a stable, id-sorted list. */
async function loadBlockItems(
  section: MarketplaceSection & { scopes: MarketplaceSectionScope[] },
  blockName: string,
  viewer: ScopeViewer
): Promise<RenderItem[]> {
  const block = blockRegistry.get(blockName);
  if (!block) return [];
  const allowedTypes = new Set(block.types);

  const scopes = section.scopes
    .filter((s) => s.blockName === blockName)
    .filter((s) => scopeMatchesViewer(s, viewer));
  if (scopes.length === 0) return [];

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

  const filtered = candidates.filter((item) =>
    scopes.some((s) => itemMatchesScope(item, s))
  );

  // De-dup by id and sort by id for paging stability.
  const seen = new Set<string>();
  const deduped: RenderItem[] = [];
  for (const item of filtered) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
  }
  deduped.sort((a, b) => a.id.localeCompare(b.id));
  return deduped;
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

  const blockNames = Array.from(
    new Set(
      section.scopes
        .filter((s) => scopeMatchesViewer(s, viewer))
        .map((s) => s.blockName)
    )
  );

  for (const blockName of blockNames) {
    const all = await loadBlockItems(section, blockName, viewer);
    ctx.totalByBlock[blockName] = all.length;
    const initial = all.slice(0, INITIAL_ITEMS_PAGE_SIZE);
    ctx.itemsByBlock[blockName] = initial;
    ctx.hasMoreByBlock[blockName] = all.length > initial.length;

    const cats = new Set<string>();
    const subs = new Set<string>();
    for (const it of all) {
      if (it.category) cats.add(it.category);
      const sub = (it.meta as Record<string, unknown>)?.subCategory;
      if (typeof sub === "string" && sub) subs.add(sub);
    }
    ctx.categoriesByBlock[blockName] = Array.from(cats).sort();
    ctx.subCategoriesByBlock[blockName] = Array.from(subs).sort();
    ctx.facetsByBlock[blockName] = buildFacets(all, getFilterFields(blockName));
  }

  return ctx;
}
