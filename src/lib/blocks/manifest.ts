// ─── Block Manifest Types ──────────────────────────────────────────
// Every block declares its capabilities and actions via a BlockManifest.
// The orchestrator LLM uses these to route user requests.
//
// R0.2 introduced a discriminated union (EntityManifest). R1 reconciled
// the union with the canonical Tool/ToolCategoryManifest types in
// `src/lib/tools/manifest.ts` (which were pre-existing and richer than
// the provisional shapes once defined here). The provisional ToolManifest
// and FeatureManifest types were dead code (zero external callers) and
// have been removed. The top-level feature variant returns in R2 when
// the first real feature manifest lands.

import type { Tool, ToolCategoryManifest } from "@/lib/tools/manifest";

export type EntityKind = "block" | "tool" | "tool_category";

export type EntityManifest = BlockManifest | Tool | ToolCategoryManifest;

export interface BlockAction {
  /** Globally unique action name, e.g. "create_product" */
  name: string;
  /** Natural-language description for the LLM */
  description: string;
  /** HTTP method */
  method: "GET" | "POST" | "PATCH" | "DELETE";
  /** API endpoint path, e.g. "/api/products" or "/api/products/{id}" */
  endpoint: string;
  /** JSON Schema describing the action's parameters */
  parametersSchema: Record<string, unknown>;
  /** Fields the LLM must always provide */
  requiredFields?: string[];
  /** Human-readable description of what the response contains */
  responseDescription: string;
}

/**
 * BlockManifest — single source of truth for a data type.
 *
 * R0.2: shape preserved (10 functional fields), `kind: "block"` added,
 * `domain` field removed (drift severe; reintroduce as `category` later
 * when there is consumer demand).
 */
export interface BlockManifest {
  kind: "block";
  /** Machine name, e.g. "products" */
  name: string;
  /** Display name, e.g. "Products" */
  displayName: string;
  /** Business-level description for the LLM system prompt */
  description: string;
  /** Data types this block owns — must match DataProvider types */
  types: string[];
  /** High-level capabilities: "read", "create", "update", "delete", "sync", etc. */
  capabilities: string[];
  /** All actions this block exposes to the orchestrator */
  actions: BlockAction[];
  /** Prisma model names this block owns */
  models: string[];
  /** Other block names this block depends on */
  dependencies: string[];
  /** File paths (relative to project root) */
  paths: {
    components: string;
    pages: string;
    api: string;
    lib?: string;
    validators?: string;
    provider?: string;
  };
  /** Optional nested block groups (R3 will introduce real ones, e.g. packages of products) */
  groups?: BlockGroupSpec[];
}

/**
 * BlockGroupSpec — nested block group (intra-block grouping).
 *
 * Used by R3 (packages → block group of products). Stored inside the
 * parent block's manifest under `groups[]`.
 */
export interface BlockGroupSpec {
  name: string;
  displayName: string;
  description: string;
  parentBlock: string;
  metadataModels?: string[];
}

// ─── Type guards ────────────────────────────────────────────────────

export function isBlockManifest(m: EntityManifest): m is BlockManifest {
  return m.kind === "block";
}

export function isToolManifest(m: EntityManifest): m is Tool {
  return m.kind === "tool";
}

export function isToolCategoryManifest(m: EntityManifest): m is ToolCategoryManifest {
  return m.kind === "tool_category";
}
