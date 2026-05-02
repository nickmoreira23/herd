// ─── Block Manifest Types ──────────────────────────────────────────
// Every block declares its capabilities and actions via a BlockManifest.
// The orchestrator LLM uses these to route user requests.
//
// R0.2 introduces a discriminated union (EntityManifest) preparing the
// registry for R3-R7 reclassifications. Today all 32 manifests carry
// kind: "block". Tools and top-level features land in R1 / R2 with their
// own registries; reclassifications happen in R3-R7 by changing kind +
// moving paths.

export type EntityKind = "block" | "tool" | "top_level_feature";

export type EntityManifest = BlockManifest | ToolManifest | FeatureManifest;

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
 * ToolManifest — composição cross-block for a specific business goal.
 *
 * Shape provisional. Refined in R1 against the first real tool case.
 * Mirrors BlockManifest fields where UI/LLM symmetry is useful
 * (displayName, description, capabilities) by default.
 */
export interface ToolManifest {
  kind: "tool";
  name: string;
  displayName: string;
  description: string;
  capabilities: string[];
  /** Block/feature names this tool composes */
  consumes: string[];
  /** Optional Prisma models (only for execution records) */
  models?: string[];
  /** Optional actions a tool may expose */
  actions?: BlockAction[];
  paths: {
    components: string;
    pages: string;
    api?: string;
    lib?: string;
  };
}

/**
 * FeatureManifest — top-level feature with rich internal complexity.
 *
 * Shape provisional. Refined in R2 against the first real feature case.
 */
export interface FeatureManifest {
  kind: "top_level_feature";
  name: string;
  displayName: string;
  description: string;
  capabilities: string[];
  consumes: string[];
  models: string[];
  actions?: BlockAction[];
  sidebar: {
    icon: string;
    order: number;
  };
  paths: {
    components: string;
    pages: string;
    api?: string;
    lib?: string;
  };
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

export function isToolManifest(m: EntityManifest): m is ToolManifest {
  return m.kind === "tool";
}

export function isFeatureManifest(m: EntityManifest): m is FeatureManifest {
  return m.kind === "top_level_feature";
}
