import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/slug";
import { getBlockTaxonomy } from "@/lib/blocks/taxonomy";

describe("slugify — canonical taxonomy normalization (L2a.2b)", () => {
  it("reproduces the manifest taxonomy keys", () => {
    expect(slugify("SUPPLEMENT")).toBe("supplement");
    expect(slugify("Pre-Workout")).toBe("pre-workout");
    expect(slugify("APPAREL")).toBe("apparel");
  });

  it("collapses non-alphanumeric runs and trims", () => {
    expect(slugify("  Health & Wellness  ")).toBe("health-wellness");
    expect(slugify("A / B")).toBe("a-b");
    expect(slugify("already-slug")).toBe("already-slug");
  });

  it("agrees with every products taxonomy key (slugify(label) === key)", () => {
    const tax = getBlockTaxonomy("products");
    expect(tax).toBeDefined();
    for (const cat of tax!.categories) {
      // category keys were authored as slugs of the canonical uppercase value
      expect(slugify(cat.label)).toBe(cat.key);
      for (const sub of cat.subcategories ?? []) {
        expect(slugify(sub.label)).toBe(sub.key);
      }
    }
  });
});
