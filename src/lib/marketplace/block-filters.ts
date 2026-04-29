import type { RenderItem } from "./render-resolver";

/**
 * Filter fields available per block. Each field knows how to extract
 * its value from a `RenderItem` (top-level or nested under `meta`).
 *
 * Adding a new filter for a block: append to the matching array. The
 * UI auto-renders facets for any field that yields ≥2 distinct values.
 */
export interface FilterField {
  key: string;
  label: string;
  getValue: (item: RenderItem) => string | null;
}

const META = (key: string) => (item: RenderItem) => {
  const v = (item.meta as Record<string, unknown>)?.[key];
  return typeof v === "string" && v ? v : null;
};

const TOP = (key: keyof RenderItem) => (item: RenderItem) => {
  const v = item[key];
  return typeof v === "string" && v ? v : null;
};

const COMMON: FilterField[] = [
  { key: "category", label: "Category", getValue: TOP("category") },
  { key: "status", label: "Status", getValue: TOP("status") },
];

const PRODUCT_FILTERS: FilterField[] = [
  ...COMMON,
  { key: "subCategory", label: "Sub-category", getValue: META("subCategory") },
  { key: "brand", label: "Brand", getValue: META("brand") },
];

const AGENT_FILTERS: FilterField[] = [...COMMON];

const KNOWLEDGE_FILTERS: FilterField[] = [
  ...COMMON,
  { key: "type", label: "Type", getValue: TOP("type") },
];

const FILTERS_BY_BLOCK: Record<string, FilterField[]> = {
  products: PRODUCT_FILTERS,
  agents: AGENT_FILTERS,
  knowledge: KNOWLEDGE_FILTERS,
  documents: KNOWLEDGE_FILTERS,
  images: KNOWLEDGE_FILTERS,
  videos: KNOWLEDGE_FILTERS,
  audios: KNOWLEDGE_FILTERS,
};

export function getFilterFields(blockName: string): FilterField[] {
  return FILTERS_BY_BLOCK[blockName] ?? COMMON;
}

/** Returns whether the item passes every active filter. */
export function applyFilters(
  item: RenderItem,
  filters: Record<string, string[]>,
  fields: FilterField[]
): boolean {
  for (const field of fields) {
    const selected = filters[field.key];
    if (!selected || selected.length === 0) continue;
    const value = field.getValue(item);
    if (value === null || !selected.includes(value)) return false;
  }
  return true;
}

export function applySearch(item: RenderItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  if (item.name.toLowerCase().includes(q)) return true;
  if (item.description && item.description.toLowerCase().includes(q)) return true;
  // Allow searching by sku/brand/subCategory etc — anything stringy in meta.
  for (const v of Object.values(item.meta ?? {})) {
    if (typeof v === "string" && v.toLowerCase().includes(q)) return true;
  }
  return false;
}

/** Build facets from a fully-resolved item set: distinct values + counts. */
export interface Facet {
  key: string;
  label: string;
  options: Array<{ value: string; count: number }>;
}

export function buildFacets(
  items: RenderItem[],
  fields: FilterField[]
): Facet[] {
  return fields
    .map((f) => {
      const counts = new Map<string, number>();
      for (const item of items) {
        const v = f.getValue(item);
        if (!v) continue;
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      const options = [...counts.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([value, count]) => ({ value, count }));
      return { key: f.key, label: f.label, options };
    })
    .filter((f) => f.options.length >= 2);
}
