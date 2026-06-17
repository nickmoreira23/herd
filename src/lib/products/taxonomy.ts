import { getBlockTaxonomy } from "@/lib/blocks/taxonomy";

/**
 * L2a.2c — product taxonomy derived from the block MANIFEST (the single source;
 * supersedes the former PRODUCT_CATEGORIES/SUB_CATEGORIES constants in
 * src/types). The product UI + validator operate in the RAW value space that
 * Product.category/subCategory store — NOT the slug key (#39: Product is
 * unchanged). The bridge from the manifest:
 *   - category value  = manifest category label.toUpperCase()  ("Supplement" → "SUPPLEMENT")
 *   - subcategory value = manifest subcategory label verbatim   ("Pre-Workout")
 * (The slug `key` — "supplement"/"pre-workout" — is the marketplace scope/facet
 * space and is intentionally NOT used here.)
 */
const productTaxonomy = getBlockTaxonomy("products");

/** Raw category values (uppercase), in manifest order — what Product.category stores. */
export const PRODUCT_CATEGORIES: string[] = (productTaxonomy?.categories ?? []).map((c) =>
  c.label.toUpperCase(),
);

/** Map of raw category value → sub-category labels (what Product.subCategory stores). */
export const SUB_CATEGORIES: Record<string, string[]> = Object.fromEntries(
  (productTaxonomy?.categories ?? []).map((c) => [
    c.label.toUpperCase(),
    (c.subcategories ?? []).map((s) => s.label),
  ]),
);
