import { describe, it, expect, vi, beforeEach } from "vitest";
import { MarketplaceScopeType } from "@prisma/client";
import type { MemberRole } from "@prisma/client";
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

// L2a.2b-4b — buildRenderContext now reads the materialized taxonomy entities
// for strips/facets. Mock prisma.category so the unit tests stay DB-free; each
// test sets categoryRows to control the declared taxonomy.
let categoryRows: Array<{
  sourceKey: string;
  name: string;
  subcategories: Array<{ sourceKey: string; name: string }>;
}> = [];
// L2b.2 — loadBlockItems also reads prisma.listing (curated items). The unit
// tests keep it empty (the scope+listing merge is covered by an integration
// test); always [].
const listingRows: Array<Record<string, unknown>> = [];
vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: { findMany: vi.fn(async () => categoryRows) },
    listing: { findMany: vi.fn(async () => listingRows) },
  },
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
  allowedRoles: MemberRole[];
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
    allowedRoles: [],
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

const VIEWER = { isSuperAdmin: false, roles: [] as MemberRole[] };

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

  // L2b.2 — ITEM scope is deprecated (curated items are Listings now). The
  // resolver no longer matches it, so an ITEM scope yields nothing.
  it("ITEM scope is no longer matched (deprecated → empty)", async () => {
    expect(
      await idsFor([scope({ scopeType: MarketplaceScopeType.ITEM, scopeValue: "bbb" })])
    ).toEqual([]);
  });

  it("CATEGORY scope with a non-matching value returns nothing", async () => {
    expect(
      await idsFor([
        scope({ scopeType: MarketplaceScopeType.CATEGORY, scopeValue: "nope" }),
      ])
    ).toEqual([]);
  });

  // L2a.2b — scopeValue is the stable SLUG; the resolver slug-normalizes the
  // item's raw category/subcategory before comparing.
  it("CATEGORY scope (slug) matches an item whose RAW category is non-slug", async () => {
    seed([
      product("raw1", { name: "Pre", category: "SUPPLEMENT", subCategory: "Pre-Workout" }),
      product("raw2", { name: "Tee", category: "APPAREL", subCategory: "Tee" }),
    ]);
    expect(
      await idsFor([
        scope({ scopeType: MarketplaceScopeType.CATEGORY, scopeValue: "supplement" }),
      ])
    ).toEqual(["product:raw1"]);
  });

  it("SUB_CATEGORY scope (slug) matches an item whose RAW subcategory is non-slug", async () => {
    seed([
      product("raw1", { name: "Pre", category: "SUPPLEMENT", subCategory: "Pre-Workout" }),
      product("raw2", { name: "Whey", category: "SUPPLEMENT", subCategory: "Protein" }),
    ]);
    expect(
      await idsFor([
        scope({ scopeType: MarketplaceScopeType.SUB_CATEGORY, scopeValue: "pre-workout" }),
      ])
    ).toEqual(["product:raw1"]);
  });

  it("CATEGORY scope does NOT match when slugs differ", async () => {
    seed([product("raw2", { name: "Tee", category: "APPAREL" })]);
    expect(
      await idsFor([
        scope({ scopeType: MarketplaceScopeType.CATEGORY, scopeValue: "supplement" }),
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

describe("render-resolver — internal role visibility (SE5a)", () => {
  beforeEach(() =>
    seed([product("aaa", { name: "Whey" }), product("bbb", { name: "Creatine" })])
  );

  const items = (s: ReturnType<typeof scope>[], viewer: { isSuperAdmin: boolean; roles: MemberRole[] }) =>
    resolveItemsPage(section(s), "products", viewer, { offset: 0, limit: 50 }).then((p) => p.total);

  it("unrestricted scope (empty allowedRoles) is visible to any logged member", async () => {
    expect(await items([scope({})], { isSuperAdmin: false, roles: ["MEMBER"] })).toBe(2);
  });

  it("unrestricted scope is visible to an anonymous viewer (roles [])", async () => {
    expect(await items([scope({})], { isSuperAdmin: false, roles: [] })).toBe(2);
  });

  it("restricted scope [ADMIN] is VISIBLE to an ADMIN viewer", async () => {
    expect(
      await items([scope({ allowedRoles: ["ADMIN"] })], { isSuperAdmin: false, roles: ["ADMIN"] })
    ).toBe(2);
  });

  it("restricted scope [ADMIN] is HIDDEN from a MEMBER viewer", async () => {
    expect(
      await items([scope({ allowedRoles: ["ADMIN"] })], { isSuperAdmin: false, roles: ["MEMBER"] })
    ).toBe(0);
  });

  it("restricted scope is HIDDEN from an anonymous viewer (roles [])", async () => {
    expect(
      await items([scope({ allowedRoles: ["ADMIN"] })], { isSuperAdmin: false, roles: [] })
    ).toBe(0);
  });

  it("super_admin sees a restricted scope regardless of roles", async () => {
    expect(
      await items([scope({ allowedRoles: ["ADMIN"] })], { isSuperAdmin: true, roles: [] })
    ).toBe(2);
  });

  it("visible when any of the viewer's roles intersects allowedRoles", async () => {
    expect(
      await items([scope({ allowedRoles: ["OWNER", "ADMIN"] })], {
        isSuperAdmin: false,
        roles: ["MEMBER", "ADMIN"],
      })
    ).toBe(2);
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
  beforeEach(() => {
    seed([
      product("aaa", { name: "Whey", category: "supplements", subCategory: "protein" }),
      product("bbb", { name: "Tee", category: "apparel", subCategory: "shirts" }),
    ]);
    // Declared taxonomy from the materialized entities — note "vitamins" has
    // ZERO items, proving facets come from the entities, not the item distinct.
    categoryRows = [
      {
        sourceKey: "supplements",
        name: "Supplements",
        subcategories: [{ sourceKey: "protein", name: "Protein" }],
      },
      { sourceKey: "apparel", name: "Apparel", subcategories: [{ sourceKey: "shirts", name: "Shirts" }] },
      { sourceKey: "vitamins", name: "Vitamins", subcategories: [] },
    ];
  });

  it("strips come from the materialized entities, with counts (incl. zero-item categories)", async () => {
    const ctx = await buildRenderContext(
      section([scope({ scopeType: MarketplaceScopeType.ALL })]),
      VIEWER
    );
    expect(ctx.totalByBlock.products).toBe(2);
    expect(ctx.itemsByBlock.products).toHaveLength(2);
    expect(ctx.categoriesByBlock.products).toEqual([
      { key: "supplements", label: "Supplements", count: 1 },
      { key: "apparel", label: "Apparel", count: 1 },
      { key: "vitamins", label: "Vitamins", count: 0 }, // declared, no item yet
    ]);
    expect(ctx.subCategoriesByBlock.products).toEqual([
      { key: "protein", label: "Protein", count: 1 },
      { key: "shirts", label: "Shirts", count: 1 },
    ]);
    // The category facet carries slug values + labels (for the filter popover).
    const catFacet = ctx.facetsByBlock.products.find((f) => f.key === "category");
    expect(catFacet?.options).toEqual([
      { value: "supplements", label: "Supplements", count: 1 },
      { value: "apparel", label: "Apparel", count: 1 },
      { value: "vitamins", label: "Vitamins", count: 0 },
    ]);
  });

  it("flat block (no entities) yields empty taxonomy strips", async () => {
    categoryRows = [];
    const ctx = await buildRenderContext(
      section([scope({ scopeType: MarketplaceScopeType.ALL })]),
      VIEWER
    );
    expect(ctx.categoriesByBlock.products).toEqual([]);
    expect(ctx.facetsByBlock.products.find((f) => f.key === "category")).toBeUndefined();
  });

  it("only includes blocks whose scopes are visible to the viewer", async () => {
    const ctx = await buildRenderContext(
      section([scope({ scopeType: MarketplaceScopeType.ALL, allowedRoles: ["ADMIN"] })]),
      { isSuperAdmin: false, roles: ["MEMBER"] }
    );
    // role-restricted scope hidden from a MEMBER viewer → block absent
    expect(ctx.itemsByBlock.products).toBeUndefined();
  });
});
