// ─── Tool Manifest Types ──────────────────────────────────────────
// Tools are the high-level capabilities exposed to users and agents.
// Each tool belongs to a Category (business area, e.g. Finances, Legal)
// and composes one or more blocks to deliver a focused outcome.

// ─── Tool Action ──────────────────────────────────────────────────

export interface ToolAction {
  /** Globally unique action name, e.g. "list_projections" */
  name: string;
  /** Natural-language description for the LLM */
  description: string;
  /** Block actions this orchestrates (in order), e.g. ["create_document", "create_form"] */
  blockActions?: string[];
  /** Direct API endpoint if the tool has its own route */
  endpoint?: string;
  /** HTTP method (only if endpoint is set) */
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** JSON Schema describing the action's parameters */
  parametersSchema: Record<string, unknown>;
  /** Fields the LLM must always provide */
  requiredFields?: string[];
  /** Human-readable description of what the response contains */
  responseDescription: string;
}

// ─── Block Connection ─────────────────────────────────────────────

export interface BlockConnection {
  /** Block name from the block registry, e.g. "documents" */
  blockName: string;
  /** How the tool uses this block */
  usage: "read" | "write" | "read-write";
  /** Human-readable explanation of why this block is needed */
  purpose: string;
}

// ─── Tool ─────────────────────────────────────────────────────────

export type ToolStatus = "active" | "beta" | "coming-soon";

export interface Tool {
  kind: "tool";
  /** Machine name, e.g. "projections" */
  name: string;
  /** Display name, e.g. "Projections" */
  displayName: string;
  /** Business-level description for the LLM system prompt */
  description: string;
  /** Lucide icon name (string for serialization) */
  icon: string;
  /** Hex color for visual theming */
  color: string;
  /** Current development status */
  status: ToolStatus;
  /** Which blocks this tool composes */
  blocks: BlockConnection[];
  /** Agent keys this tool leverages (from agents block) */
  agentKeys?: string[];
  /** Actions this tool exposes */
  actions: ToolAction[];
  /** Whether this tool has sub-routes beyond the main page */
  hasSubRoutes: boolean;
  /**
   * Optional business discipline (e.g., "finances", "legal", "marketing",
   * "sales", "operations"). Cross-cutting tools (chat, marketplace,
   * knowledge, network, handbook, dashboard) leave this undefined.
   * Tools embedded in a ToolCategoryManifest inherit the category implicitly.
   */
  category?: string;
  /**
   * Mandatory area positioning the tool in the product macro-division.
   * Values: "communication" | "transaction" | "workflow" | "notification"
   *         | "identity" | "infrastructure".
   */
  area: string;
  /** File paths (relative to project root) */
  paths: {
    page: string;
    components?: string;
    api?: string;
  };
}

// ─── Tool Category Manifest ───────────────────────────────────────
// A Category groups Tools by business area (Finances, Legal, etc.).
// In the future, "Solution" will return as a goal-oriented composition
// of tools — intentionally not modeled here yet.

export interface ToolCategoryManifest {
  kind: "tool_category";
  /** Machine name, e.g. "finances" */
  name: string;
  /** Display name, e.g. "Finances" */
  displayName: string;
  /** Business-level description for the LLM system prompt */
  description: string;
  /** Lucide icon name (string for serialization) */
  icon: string;
  /** Hex color for visual theming */
  color: string;
  /** Business domain this category targets */
  domain: string;
  /** The tools within this category */
  tools: Tool[];
  /** High-level capabilities for the LLM */
  capabilities: string[];
  /** Sort order in navigation */
  sortOrder: number;
}
