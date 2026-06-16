import { describe, it, expect } from "vitest";
import { blockTaxonomySchema, getBlockTaxonomy } from "../taxonomy";
import { getAllBlocks } from "../registry";

// L2a.2a — the universal taxonomy contract lives on the base manifest type;
// products is just the first block to FILL it. These tests prove the contract
// is generic (not product-coupled) and that the shape validation holds.

describe("blockTaxonomySchema — shape validation", () => {
  it("accepts a valid 2-level taxonomy (slug keys, non-empty labels)", () => {
    const ok = blockTaxonomySchema.safeParse({
      categories: [
        { key: "supplement", label: "Supplement", subcategories: [{ key: "pre-workout", label: "Pre-Workout" }] },
        { key: "apparel", label: "Apparel" }, // subcategories optional
      ],
    });
    expect(ok.success).toBe(true);
  });

  it("rejects a non-slug key (uppercase / spaces)", () => {
    expect(
      blockTaxonomySchema.safeParse({ categories: [{ key: "SUPPLEMENT", label: "Supplement" }] }).success
    ).toBe(false);
    expect(
      blockTaxonomySchema.safeParse({ categories: [{ key: "pre workout", label: "x" }] }).success
    ).toBe(false);
  });

  it("rejects an empty label", () => {
    expect(
      blockTaxonomySchema.safeParse({ categories: [{ key: "supplement", label: "" }] }).success
    ).toBe(false);
  });

  it("rejects a non-slug subcategory key", () => {
    expect(
      blockTaxonomySchema.safeParse({
        categories: [{ key: "supplement", label: "Supplement", subcategories: [{ key: "Pre-Workout", label: "Pre-Workout" }] }],
      }).success
    ).toBe(false);
  });
});

describe("getBlockTaxonomy — getter (the L2a.2b seed source)", () => {
  it("returns undefined for a block that declares no taxonomy (optional contract)", () => {
    expect(getBlockTaxonomy("agents")).toBeUndefined();
    expect(getBlockTaxonomy("notes")).toBeUndefined();
  });

  it("returns undefined for an unknown block name", () => {
    expect(getBlockTaxonomy("does-not-exist")).toBeUndefined();
  });

  it("products exposes 3 categories with the migrated subcategories", () => {
    const tax = getBlockTaxonomy("products");
    expect(tax).toBeDefined();
    expect(tax!.categories.map((c) => c.key)).toEqual(["supplement", "apparel", "accessory"]);
    const supplement = tax!.categories.find((c) => c.key === "supplement")!;
    expect(supplement.label).toBe("Supplement");
    expect(supplement.subcategories?.map((s) => s.key)).toEqual([
      "pre-workout", "protein", "amino", "vitamin", "health", "recovery", "other",
    ]);
    expect(tax!.categories.find((c) => c.key === "apparel")!.subcategories).toHaveLength(5);
    expect(tax!.categories.find((c) => c.key === "accessory")!.subcategories).toHaveLength(4);
  });

  it("every declared block taxonomy (only products today) passes the schema — proves the contract is generic", () => {
    const withTaxonomy = getAllBlocks().filter((b) => b.taxonomy);
    expect(withTaxonomy.map((b) => b.name)).toEqual(["products"]);
    for (const b of withTaxonomy) {
      expect(blockTaxonomySchema.safeParse(b.taxonomy).success).toBe(true);
    }
  });
});
