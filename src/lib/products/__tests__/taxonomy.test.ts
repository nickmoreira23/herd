import { describe, it, expect } from "vitest";
import { PRODUCT_CATEGORIES, SUB_CATEGORIES } from "@/lib/products/taxonomy";
import { createProductSchema } from "@/lib/validators/product";

// L2a.2c — the manifest is now the single source of the product taxonomy.
// These tests prove the derived shape is IDENTICAL to what src/types used to
// hand the UI (parity → the source swap is invisible), and that the validator
// still accepts exactly the categories it did before.

describe("product taxonomy derived from the manifest — parity with the old src/types", () => {
  it("PRODUCT_CATEGORIES matches the former constant (raw uppercase, same order)", () => {
    expect(PRODUCT_CATEGORIES).toEqual(["SUPPLEMENT", "APPAREL", "ACCESSORY"]);
  });

  it("SUB_CATEGORIES matches the former map (keyed by raw category, label values)", () => {
    expect(SUB_CATEGORIES).toEqual({
      SUPPLEMENT: ["Pre-Workout", "Protein", "Amino", "Vitamin", "Health", "Recovery", "Other"],
      APPAREL: ["Tee", "Hoodie", "Shorts", "Hat", "Other"],
      ACCESSORY: ["Shaker", "Bag", "Gear", "Other"],
    });
  });
});

describe("product validator category — no regression after the source swap", () => {
  const base = { name: "X", sku: "X-1", retailPrice: 10, costOfGoods: 3 };

  it("accepts the canonical categories (and upcases mixed/lower case)", () => {
    for (const input of ["SUPPLEMENT", "apparel", "Accessory"]) {
      const r = createProductSchema.safeParse({ ...base, category: input });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.category).toBe(input.toUpperCase());
    }
  });

  it("rejects an unknown category", () => {
    expect(createProductSchema.safeParse({ ...base, category: "GADGET" }).success).toBe(false);
  });
});
