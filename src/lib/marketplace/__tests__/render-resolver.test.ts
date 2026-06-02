import { describe, it, expect, vi, beforeEach } from "vitest";
import { MarketplaceScopeType } from "@prisma/client";
import type { ArtifactMeta, CatalogItem } from "@/lib/chat/types";

// ── Mock the two collaborators loadBlockItems depends on ────────────────
// blockRegistry resolves a block name → its allowed artifact types.
vi.mock("@/lib/blocks/registry", () => ({
  blockRegistry: new Map([
    ["products", { name: "products", displayName: "Products", types: ["product"] }],
  ]),
}));

// providers is the data-retrieval catalog. We expose a single product
// provider whose two methods are vi.fn() so each test sets its own data.
vi.mock("@/lib/chat/data-retrieval", () => ({
  providers: [
    {
      domain: "foundation",
      types: ["product"],
      getCatalogItems: vi.fn(),
      getArtifactMeta: vi.fn(),
    },
  ],
}));

import {
  resolveItemsPage,
  buildRenderContext,
  MAX_ITEMS_PAGE_SIZE,
} from "../render-resolver";
import { providers } from "@/lib/chat/data-retrieval";

const provider = providers[0] as unknown as {
  getCatalogItems: ReturnType<typeof vi.fn>;
  getArtifactMeta: ReturnType<typeof vi.fn>;
};

type Scope = {
  id: string;
  sectionId: string;
  blockName: string;
  scopeType: MarketplaceScopeType;
  scopeValue: string | null;
  sortOrder: number;
  allowedProfileTypeIds: string[];
  allowedRoleIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

function scope(partial: Partial<Scope>): Scope {
  return {
    id: "s1",
    sectionId: "sec1",
    blockName: "products",
    scopeType: MarketplaceScopeType.ALL,
    scopeValue: null,
    sortOrder: 0,
    allowedProfileTypeIds: [],
    allowedRoleIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

function section(scopes: Scope[]) {
  // Only the `scopes` relation is read by the resolvers; the rest of the
  // MarketplaceSection row is irrelevant here, so we cast a minimal object.
  return { id: "sec1", scopes } as never;
}

const VIEWER = { profileTypeId: null, roleIds: [] as string[] };

/** Build a product ArtifactMeta in the real "type:uuid" id shape. */
function product(
  rawId: string,
  fields: Partial<ArtifactMeta> & { subCategory?: string } = {}
): ArtifactMeta {
  const { subCategory, ...rest } = fields;
  return {
    id: `product:${rawId}`,
    type: "product",
    name: rest.name ?? rawId,
    description: rest.description ?? null,
    category: rest.category ?? "supplements",
    status: rest.status ?? "active",
    imageUrl: rest.imageUrl ?? null,
    meta: { ...(subCategory ? { subCategory } : {}), ...(rest.meta ?? {}) },
  };
}

/** Wire the provider to expose the given products. */
function seed(products: ArtifactMeta[]) {
  const catalog: CatalogItem[] = products.map((p) => ({
    id: p.id,
    type: "product",
    domain: "foundation",
    name: p.name,
    description: p.description ?? null,
    contentLength: 0,
  }));
  provider.getCatalogItems.mockResolvedValue(catalog);
  provider.getArtifactMeta.mockResolvedValue(products);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("render-resolver — scope × item matching (via resolveItemsPage)", () => {
  const ITEMS = [
    product("aaa", { name: "Whey", category: "supplements", subCategory: "protein" }),
    product("bbb", { name: "Creatine", category: "supplements", subCategory: "creatine" }),
    product("ccc", { name: "Tee", category: "apparel", subCategory: "shirts" }),
  ];

  beforeEach(() => seed(ITEMS));

  async function idsFor(s: Scope[]) {
    const page = await resolveItemsPage(section(s), "products", VIEWER, {
      offset: 0,
      limit: 50,
    });
    return page.items.map((i) => i.id).sort();
  }

  it("ALL scope matches every item", async () => {
    expect(await idsFor([scope({ scopeType: MarketplaceScopeType.ALL })])).toEqual([
      "product:aaa",
      "product:bbb",
      "product:ccc",
    ]);
  });

  it("CATEGORY scope matches by category and rejects others", async () => {
    expect(
      await idsFor([
        scope({ scopeType: MarketplaceScopeType.CATEGORY, scopeValue: "supplements" }),
      ])
    ).toEqual(["product:aaa", "product:bbb"]);
  });

  it("SUB_CATEGORY scope matches by meta.subCategory", async () => {
    expect(
      await idsFor([
        scope({ scopeType: MarketplaceScopeType.SUB_CATEGORY, scopeValue: "protein" }),
      ])
    ).toEqual(["product:aaa"]);
  });

  it("ITEM scope matches by raw id (namespace prefix stripped)", async () => {
    expect(
      await idsFor([scope({ scopeType: MarketplaceScopeType.ITEM, scopeValue: "bbb" })])
    ).toEqual(["product:bbb"]);
  });

  it("CATEGORY scope with a non-matching value returns nothing", async () => {
    expect(
      await idsFor([
        scope({ scopeType: MarketplaceScopeType.CATEGORY, scopeValue: "nope" }),
      ])
    ).toEqual([]);
  });

  it("de-dupes items matched by multiple scopes", async () => {
    expect(
      await idsFor([
        scope({ id: "s1", scopeType: MarketplaceScopeType.ALL }),
        scope({
          id: "s2",
          scopeType: MarketplaceScopeType.CATEGORY,
          scopeValue: "supplements",
        }),
      ])
    ).toEqual(["product:aaa", "product:bbb", "product:ccc"]);
  });
});

describe("render-resolver — visibility gating (BASELINE, changes in SE5)", () => {
  beforeEach(() =>
    seed([product("aaa", { name: "Whey" }), product("bbb", { name: "Creatine" })])
  );

  it("unrestricted scope (empty allowed arrays) passes ANY viewer — the de-facto fail-open", async () => {
    // This is THE current 'passes everything' behavior: the admin UI can no
    // longer populate allowed*Ids (NetworkProfileType/Role removed in Sub-3.5/3.6),
    // so every scope is unrestricted and visible to all viewers.
    const page = await resolveItemsPage(
      section([scope({ scopeType: MarketplaceScopeType.ALL })]),
      "products",
      { profileTypeId: null, roleIds: [] },
      { offset: 0, limit: 50 }
    );
    expect(page.total).toBe(2);
  });

  it("restricted scope is HIDDEN from a viewer lacking the attribute (fail-CLOSED at scope level)", async () => {
    // CHARACTERIZATION NOTE / DISCREPANCY WITH SPEC: the SE2 spec assumed a
    // populated allowedProfileTypeIds + an attribute-less viewer would still
    // "pass anyway". The code does the OPPOSITE: scopeMatchesViewer returns
    // false, the scope is filtered out, and the item disappears. Since
    // getViewerContext always yields profileTypeId=null today, ANY restricted
    // scope would be invisible to everyone. Captured as the real baseline; the
    // SE5 visibility decision must account for this.
    const page = await resolveItemsPage(
      section([
        scope({ scopeType: MarketplaceScopeType.ALL, allowedProfileTypeIds: ["pt-1"] }),
      ]),
      "products",
      { profileTypeId: null, roleIds: [] },
      { offset: 0, limit: 50 }
    );
    expect(page.total).toBe(0);
  });

  it("restricted scope is VISIBLE to a viewer whose profileTypeId matches", async () => {
    const page = await resolveItemsPage(
      section([
        scope({ scopeType: MarketplaceScopeType.ALL, allowedProfileTypeIds: ["pt-1"] }),
      ]),
      "products",
      { profileTypeId: "pt-1", roleIds: [] },
      { offset: 0, limit: 50 }
    );
    expect(page.total).toBe(2);
  });

  it("restricted-by-role scope is VISIBLE when a viewer role intersects", async () => {
    const page = await resolveItemsPage(
      section([scope({ scopeType: MarketplaceScopeType.ALL, allowedRoleIds: ["r-1"] })]),
      "products",
      { profileTypeId: null, roleIds: ["r-1", "r-2"] },
      { offset: 0, limit: 50 }
    );
    expect(page.total).toBe(2);
  });
});

describe("render-resolver — pagination, search, filters", () => {
  const MANY = Array.from({ length: 60 }, (_, i) =>
    // zero-padded so localeCompare ordering is deterministic
    product(String(i).padStart(3, "0"), { name: `Item ${i}` })
  );
  const ALL_SCOPE = [scope({ scopeType: MarketplaceScopeType.ALL })];

  beforeEach(() => seed(MANY));

  it("returns the requested page size and reports total + hasMore", async () => {
    const page = await resolveItemsPage(section(ALL_SCOPE), "products", VIEWER, {
      offset: 0,
      limit: 24,
    });
    expect(page.items).toHaveLength(24);
    expect(page.total).toBe(60);
    expect(page.hasMore).toBe(true);
  });

  it("caps the limit at MAX_ITEMS_PAGE_SIZE (48)", async () => {
    const page = await resolveItemsPage(section(ALL_SCOPE), "products", VIEWER, {
      offset: 0,
      limit: 1000,
    });
    expect(page.items).toHaveLength(MAX_ITEMS_PAGE_SIZE);
    expect(page.hasMore).toBe(true);
  });

  it("last page: hasMore is false when the slice reaches the end", async () => {
    const page = await resolveItemsPage(section(ALL_SCOPE), "products", VIEWER, {
      offset: 50,
      limit: 24,
    });
    expect(page.items).toHaveLength(10);
    expect(page.hasMore).toBe(false);
  });

  it("empty page: offset past the end yields no items", async () => {
    const page = await resolveItemsPage(section(ALL_SCOPE), "products", VIEWER, {
      offset: 100,
      limit: 24,
    });
    expect(page.items).toHaveLength(0);
    expect(page.total).toBe(60);
    expect(page.hasMore).toBe(false);
  });

  it("search query filters by name/description/meta", async () => {
    seed([
      product("aaa", { name: "Whey Protein" }),
      product("bbb", { name: "Creatine" }),
      product("ccc", { name: "Shaker", meta: { brand: "Whey-Brand" } }),
    ]);
    const page = await resolveItemsPage(section(ALL_SCOPE), "products", VIEWER, {
      offset: 0,
      limit: 50,
      query: "whey",
    });
    // matches name "Whey Protein" and meta.brand "Whey-Brand"
    expect(page.items.map((i) => i.id).sort()).toEqual(["product:aaa", "product:ccc"]);
  });

  it("filters select by facet value", async () => {
    seed([
      product("aaa", { name: "A", category: "supplements" }),
      product("bbb", { name: "B", category: "apparel" }),
    ]);
    const page = await resolveItemsPage(section(ALL_SCOPE), "products", VIEWER, {
      offset: 0,
      limit: 50,
      filters: { category: ["apparel"] },
    });
    expect(page.items.map((i) => i.id)).toEqual(["product:bbb"]);
  });
});

describe("render-resolver — buildRenderContext", () => {
  beforeEach(() =>
    seed([
      product("aaa", { name: "Whey", category: "supplements", subCategory: "protein" }),
      product("bbb", { name: "Tee", category: "apparel", subCategory: "shirts" }),
    ])
  );

  it("aggregates items, categories, sub-categories per block", async () => {
    const ctx = await buildRenderContext(
      section([scope({ scopeType: MarketplaceScopeType.ALL })]),
      VIEWER
    );
    expect(ctx.totalByBlock.products).toBe(2);
    expect(ctx.itemsByBlock.products).toHaveLength(2);
    expect(ctx.hasMoreByBlock.products).toBe(false);
    expect(ctx.categoriesByBlock.products).toEqual(["apparel", "supplements"]);
    expect(ctx.subCategoriesByBlock.products).toEqual(["protein", "shirts"]);
  });

  it("only includes blocks whose scopes are visible to the viewer", async () => {
    const ctx = await buildRenderContext(
      section([
        scope({ scopeType: MarketplaceScopeType.ALL, allowedProfileTypeIds: ["pt-1"] }),
      ]),
      { profileTypeId: null, roleIds: [] }
    );
    // restricted scope hidden from attribute-less viewer → block absent
    expect(ctx.itemsByBlock.products).toBeUndefined();
  });
});
