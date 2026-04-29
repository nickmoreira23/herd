/**
 * Stale-while-revalidate cache for the marketplace sub-panel listing.
 *
 * Keeps sections in two layers:
 *   1. Module-level memory — survives client-side navigations within the
 *      same SPA session (no I/O, no JSON parse).
 *   2. sessionStorage — survives full page reloads in the same tab.
 *
 * The hook in `MarketplaceSubPanel` renders cached data instantly on
 * mount and triggers a background fetch to refresh; the
 * `marketplace-sections-updated` event invalidates the cache after
 * mutations (create / edit / delete / reorder).
 */
export interface CachedSection {
  id: string;
  slug: string;
  name: string;
  iconKey: string | null;
  status: string;
}

const CACHE_KEY = "herd:marketplace-sections-v1";

let memoryCache: CachedSection[] | null = null;

export function getCachedSections(): CachedSection[] | null {
  if (memoryCache) return memoryCache;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryCache = parsed as CachedSection[];
      return memoryCache;
    }
  } catch {
    // sessionStorage unavailable or invalid JSON — fall through to null.
  }
  return null;
}

export function setCachedSections(sections: CachedSection[]) {
  memoryCache = sections;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(sections));
  } catch {
    // Quota exceeded — silently ignore; hot path remains in memory.
  }
}

export function invalidateSectionsCache() {
  memoryCache = null;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // No-op.
  }
}
