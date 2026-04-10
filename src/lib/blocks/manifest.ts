// ─── Block Manifest Types ──────────────────────────────────────────
// Every block declares its capabilities and actions via a BlockManifest.
// The orchestrator LLM uses these to route user requests.

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

export interface BlockManifest {
  /** Machine name, e.g. "products" */
  name: string;
  /** Display name, e.g. "Products" */
  displayName: string;
  /** Business-level description for the LLM system prompt */
  description: string;
  /** Domain grouping: "foundation", "knowledge", "operations", "engagement" */
  domain: string;
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
}
