import { describe, it, expect } from "vitest";
import type { RenderItem } from "../render-resolver";
import {
  getFilterFields,
  applyFilters,
  applySearch,
  buildFacets,
} from "../block-filters";

function item(partial: Partial<RenderItem> & { id: string }): RenderItem {
  return {
    type: "product",
    name: partial.name ?? partial.id,
    description: null,
    imageUrl: null,
    status: null,
    category: null,
    meta: {},
    blockName: "products",
    ...partial,
  } as RenderItem;
}

describe("getFilterFields", () => {
  it("products → category, status, subCategory, brand", () => {
    expect(getFilterFields("products").map((f) => f.key)).toEqual([
      "category",
      "status",
      "subCategory",
      "brand",
    ]);
  });

  it("agents → just the COMMON fields (category, status)", () => {
    expect(getFilterFields("agents").map((f) => f.key)).toEqual(["category", "status"]);
  });

  it("knowledge-family blocks add a `type` field", () => {
    expect(getFilterFields("documents").map((f) => f.key)).toEqual([
      "category",
      "status",
      "type",
    ]);
  });

  it("unknown block falls back to COMMON (NOT empty) — baseline", () => {
    // Characterization: an unsupported block returns the COMMON fields
    // (category, status), not an empty array.
    expect(getFilterFields("does-not-exist").map((f) => f.key)).toEqual([
      "category",
      "status",
    ]);
  });
});

describe("applyFilters", () => {
  const fields = getFilterFields("products");

  it("passes when no filters are active", () => {
    expect(applyFilters(item({ id: "a", category: "x" }), {}, fields)).toBe(true);
  });

  it("passes when the item's top-level value is selected", () => {
    expect(
      applyFilters(item({ id: "a", category: "supplements" }), { category: ["supplements"] }, fields)
    ).toBe(true);
  });

  it("rejects when the item's value is not selected", () => {
    expect(
      applyFilters(item({ id: "a", category: "apparel" }), { category: ["supplements"] }, fields)
    ).toBe(false);
  });

  it("rejects when the field value is null but a filter is active", () => {
    expect(
      applyFilters(item({ id: "a", category: null }), { category: ["supplements"] }, fields)
    ).toBe(false);
  });

  it("reads nested meta fields (subCategory)", () => {
    expect(
      applyFilters(
        item({ id: "a", meta: { subCategory: "protein" } }),
        { subCategory: ["protein"] },
        fields
      )
    ).toBe(true);
  });

  it("AND-combines multiple active filters", () => {
    const it1 = item({ id: "a", category: "supplements", meta: { brand: "Acme" } });
    expect(applyFilters(it1, { category: ["supplements"], brand: ["Acme"] }, fields)).toBe(true);
    expect(applyFilters(it1, { category: ["supplements"], brand: ["Other"] }, fields)).toBe(false);
  });

  // L2a.2b-4b — category/subCategory are slugMatch: both sides slugified.
  it("category is slug-matched — a SLUG filter matches a RAW item category", () => {
    expect(
      applyFilters(item({ id: "a", category: "SUPPLEMENT" }), { category: ["supplement"] }, fields)
    ).toBe(true);
    expect(
      applyFilters(item({ id: "a", meta: { subCategory: "Pre-Workout" } }), { subCategory: ["pre-workout"] }, fields)
    ).toBe(true);
  });

  it("category slug-match is back-compat — a stale RAW-label filter still matches", () => {
    // an old URL carrying ?category=SUPPLEMENT still filters the slugged item
    expect(
      applyFilters(item({ id: "a", category: "supplement" }), { category: ["SUPPLEMENT"] }, fields)
    ).toBe(true);
  });

  it("category slug-match rejects when slugs differ", () => {
    expect(
      applyFilters(item({ id: "a", category: "APPAREL" }), { category: ["supplement"] }, fields)
    ).toBe(false);
  });
});

describe("applySearch", () => {
  it("empty/whitespace query matches everything", () => {
    expect(applySearch(item({ id: "a", name: "Whey" }), "")).toBe(true);
    expect(applySearch(item({ id: "a", name: "Whey" }), "   ")).toBe(true);
  });

  it("matches by name (case-insensitive)", () => {
    expect(applySearch(item({ id: "a", name: "Whey Protein" }), "whey")).toBe(true);
  });

  it("matches by description", () => {
    expect(
      applySearch(item({ id: "a", name: "X", description: "Grass-fed isolate" }), "isolate")
    ).toBe(true);
  });

  it("matches by any stringy meta value", () => {
    expect(applySearch(item({ id: "a", name: "X", meta: { brand: "Acme" } }), "acme")).toBe(true);
  });

  it("returns false when nothing matches", () => {
    expect(applySearch(item({ id: "a", name: "Whey" }), "zzz")).toBe(false);
  });
});

describe("buildFacets", () => {
  const fields = getFilterFields("products");

  it("builds NON-taxonomy facets (status) with value+label+count, sorted, ≥2 options", () => {
    const items = [
      item({ id: "a", status: "active" }),
      item({ id: "b", status: "active" }),
      item({ id: "c", status: "draft" }),
    ];
    const status = buildFacets(items, fields).find((f) => f.key === "status");
    expect(status?.options).toEqual([
      { value: "active", label: "active", count: 2 },
      { value: "draft", label: "draft", count: 1 },
    ]);
  });

  it("SKIPS taxonomy (slugMatch) facets — category/subCategory come from entities", () => {
    const items = [
      item({ id: "a", category: "supplements" }),
      item({ id: "b", category: "apparel" }),
    ];
    // even with ≥2 distinct categories, buildFacets does not emit the category
    // facet (it is built from the materialized entities in render-resolver).
    expect(buildFacets(items, fields).find((f) => f.key === "category")).toBeUndefined();
    expect(buildFacets(items, fields).find((f) => f.key === "subCategory")).toBeUndefined();
  });

  it("drops non-taxonomy facets with fewer than 2 distinct options", () => {
    const items = [item({ id: "a", status: "active" }), item({ id: "b", status: "active" })];
    expect(buildFacets(items, fields).find((f) => f.key === "status")).toBeUndefined();
  });
});
