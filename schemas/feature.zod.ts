import * as z from "zod/v4";

const Slug = z.string().regex(/^[a-z][a-z0-9-]*$/, "kebab-case, must start with letter");

// UID: dot-separated lowercase tokens.
//   herd.layer.{layer}
//   herd.category.{layer}.{category}
//   herd.{level}.{category}.{feature}    where level ∈ {network,solution,tool,block,integration}
//   herd.meta.{id}
const Uid = z.string().regex(/^herd\.[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/, "must be a valid herd.* UID");

export const Level = z.enum([
  "layer",
  "category",
  "meta",
  "network",
  "solution",
  "tool",
  "block",
  "integration",
]);

export const TechnicalCategory = z.enum([
  // architectural canonical (5)
  "block",
  "block-group",
  "tool",
  "tool-category",
  "top-level-feature",
  // thematic dimensions
  "foundation",
  "financial",
  "infrastructure",
  "sales",
  "marketing",
  "support",
  "commerce",
]);

export const Perspective = z.enum([
  "business",
  "product",
  "architecture",
  "operations",
  "glossary",
  "changelog",
]);

// Cross-references are full UIDs (allows dots). Disambiguates across categories.
const FeatureRef = Uid;

export const FeatureYmlSchema = z.object({
  id: Slug,
  uid: Uid,
  level: Level,
  technical_category: TechnicalCategory.optional(),
  title: z.object({
    "pt-BR": z.string().min(1),
    "en-US": z.string().min(1),
  }),
  description: z.object({
    "pt-BR": z.string().min(1).max(280),
    "en-US": z.string().min(1).max(280),
  }),
  status: z.enum(["draft", "active", "deprecated", "archived", "deferred"]).default("active"),
  owners: z.array(z.string()).min(1),
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  parent: FeatureRef.nullable().optional(),
  children: z.array(FeatureRef).default([]),
  consumes: z.array(FeatureRef).default([]),
  consumed_by: z.array(FeatureRef).default([]),
  related: z.array(FeatureRef).default([]),
  block_groups: z.array(z.object({
    id: Slug,
    title: z.object({ "pt-BR": z.string(), "en-US": z.string() }),
    description: z.object({ "pt-BR": z.string(), "en-US": z.string() }),
  })).optional(),
  source_paths: z.array(z.string()).default([]),
  admin_paths: z.array(z.string()).default([]),
  manifest_path: z.string().optional(),
  artifacts: z.object({
    handbook: z.boolean().default(true),
    skill: z.boolean().default(false),
    mcp: z.boolean().default(false),
  }).default({ handbook: true, skill: false, mcp: false }),
  perspectives: z.array(Perspective).default(["business", "product", "architecture"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict();

export type FeatureYml = z.infer<typeof FeatureYmlSchema>;
export type LevelValue = z.infer<typeof Level>;
