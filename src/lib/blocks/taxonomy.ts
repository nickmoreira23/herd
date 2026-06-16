import { z } from "zod";
import { blockRegistry } from "./registry";
import type { BlockTaxonomy } from "./manifest";

/**
 * Runtime validation for the (optional) block taxonomy contract. The manifest
 * is a TS interface (compile-time only), so this is the single place that
 * enforces the slug/label shape at runtime — used by tests now, and by the
 * L2a.2b seeder later before materializing entities from a manifest.
 *
 * `key` is the stable, immutable slug+sourceKey (lowercase, hyphen-separated);
 * `label` is a non-empty display seed. Two levels only.
 */
const slugKey = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "key must be slug-format (lowercase, hyphen-separated)");

const labelString = z.string().min(1, "label must be non-empty");

export const taxonomySubcategorySchema = z.object({
  key: slugKey,
  label: labelString,
});

export const taxonomyCategorySchema = z.object({
  key: slugKey,
  label: labelString,
  subcategories: z.array(taxonomySubcategorySchema).optional(),
});

export const blockTaxonomySchema = z.object({
  categories: z.array(taxonomyCategorySchema),
});

/**
 * Read a block's declared taxonomy from its manifest. Returns undefined for
 * blocks that declare none (taxonomy is optional — flat blocks). This is the
 * getter L2a.2b will consume to seed Category/Subcategory entities; no
 * consumer wired yet.
 */
export function getBlockTaxonomy(blockName: string): BlockTaxonomy | undefined {
  return blockRegistry.get(blockName)?.taxonomy;
}
