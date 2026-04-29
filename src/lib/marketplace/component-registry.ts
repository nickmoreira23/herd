import type { ComponentDefinition, ComponentNode } from "@/types/landing-page";

// ─── Marketplace component types ──────────────────────────────────
// These run inside MarketplaceSection.components (Json[]) and are NOT
// registered into the landing-page registry — they only render through
// the marketplace renderer.

export const MARKETPLACE_TYPE_PREFIX = "mkt.";

export const MARKETPLACE_TYPES = {
  BANNER: "mkt.banner",
  CATEGORIAS: "mkt.categorias",
  COLECAO: "mkt.colecao",
  ITENS_GRID: "mkt.itens-grid",
} as const;

export type MarketplaceComponentType =
  (typeof MARKETPLACE_TYPES)[keyof typeof MARKETPLACE_TYPES];

export const marketplaceComponentRegistry: Record<string, ComponentDefinition> = {
  [MARKETPLACE_TYPES.BANNER]: {
    type: MARKETPLACE_TYPES.BANNER,
    label: "Banner",
    icon: "Image",
    category: "media",
    description: "A linkable hero image. Click-through can target a category, sub-category, or specific item.",
    canHaveChildren: false,
    defaultProps: {
      imageUrl: "",
      title: "",
      subtitle: "",
      linkType: "none", // "none" | "category" | "sub_category" | "item"
      linkValue: "",
      linkBlockName: "",
    },
    defaultStyles: {
      width: "100%",
      borderRadius: 12,
    },
    propsSchema: [
      { key: "imageUrl", label: "Image", type: "image", defaultValue: "", group: "content", validation: { required: true } },
      { key: "title", label: "Title (optional)", type: "text", defaultValue: "", group: "content" },
      { key: "subtitle", label: "Subtitle (optional)", type: "text", defaultValue: "", group: "content" },
      {
        key: "linkType",
        label: "Click-through",
        type: "select",
        defaultValue: "none",
        group: "content",
        options: [
          { label: "Nothing", value: "none" },
          { label: "Category", value: "category" },
          { label: "Sub-category", value: "sub_category" },
          { label: "Specific item", value: "item" },
        ],
      },
      {
        key: "linkBlockName",
        label: "Block (for link)",
        type: "text",
        defaultValue: "",
        group: "advanced",
        placeholder: "e.g. products",
      },
      { key: "linkValue", label: "Link value", type: "text", defaultValue: "", group: "advanced", placeholder: "category name / item id" },
      { key: "borderRadius" as const, label: "Corner radius", type: "number", defaultValue: 12, group: "style" },
    ],
  },
  [MARKETPLACE_TYPES.CATEGORIAS]: {
    type: MARKETPLACE_TYPES.CATEGORIAS,
    label: "Categories strip",
    icon: "Tag",
    category: "content",
    description: "A row of category tiles. Pulls categories from one of the section's blocks.",
    canHaveChildren: false,
    defaultProps: {
      title: "Categories",
      blockName: "",
      kind: "category", // "category" | "sub_category"
    },
    defaultStyles: {
      width: "100%",
    },
    propsSchema: [
      { key: "title", label: "Title", type: "text", defaultValue: "Categories", group: "content" },
      { key: "blockName", label: "Block", type: "text", defaultValue: "", group: "content", validation: { required: true } },
      {
        key: "kind",
        label: "Kind",
        type: "select",
        defaultValue: "category",
        group: "content",
        options: [
          { label: "Categories", value: "category" },
          { label: "Sub-categories", value: "sub_category" },
        ],
      },
    ],
  },
  [MARKETPLACE_TYPES.COLECAO]: {
    type: MARKETPLACE_TYPES.COLECAO,
    label: "Collection (carousel)",
    icon: "LayoutList",
    category: "content",
    description: "A horizontally scrolling row of curated items.",
    canHaveChildren: false,
    defaultProps: {
      title: "Featured",
      subtitle: "",
      blockName: "",
      itemIds: [] as string[],
    },
    defaultStyles: {
      width: "100%",
    },
    propsSchema: [
      { key: "title", label: "Title", type: "text", defaultValue: "Featured", group: "content", validation: { required: true } },
      { key: "subtitle", label: "Subtitle", type: "text", defaultValue: "", group: "content" },
      { key: "blockName", label: "Block", type: "text", defaultValue: "", group: "content", validation: { required: true } },
      // itemIds is edited by a custom widget rather than a generic prop editor.
      { key: "itemIds", label: "Items", type: "items", defaultValue: [], group: "content" },
    ],
  },
  [MARKETPLACE_TYPES.ITENS_GRID]: {
    type: MARKETPLACE_TYPES.ITENS_GRID,
    label: "Items grid",
    icon: "Grid3x3",
    category: "content",
    description: "Full grid of items from this section's scopes.",
    canHaveChildren: false,
    defaultProps: {
      title: "All",
      blockName: "",
      columns: 4,
    },
    defaultStyles: {
      width: "100%",
    },
    propsSchema: [
      { key: "title", label: "Title", type: "text", defaultValue: "All", group: "content" },
      { key: "blockName", label: "Block", type: "text", defaultValue: "", group: "content", validation: { required: true } },
      { key: "columns", label: "Columns", type: "number", defaultValue: 4, group: "style", validation: { min: 1, max: 6 } },
    ],
  },
};

export function getMarketplaceComponent(type: string): ComponentDefinition | null {
  return marketplaceComponentRegistry[type] ?? null;
}

export function listMarketplaceComponents(): ComponentDefinition[] {
  return Object.values(marketplaceComponentRegistry);
}

export function makeMarketplaceComponent(type: MarketplaceComponentType): ComponentNode {
  const def = marketplaceComponentRegistry[type];
  return {
    id: crypto.randomUUID(),
    type,
    props: { ...def.defaultProps },
    styles: { margin: { top: 0, right: 0, bottom: 0, left: 0 }, padding: { top: 0, right: 0, bottom: 0, left: 0 }, width: "100%", height: "auto", ...def.defaultStyles },
  };
}
