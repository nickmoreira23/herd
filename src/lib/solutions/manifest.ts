// ─── Solution Manifest Types ──────────────────────────────────────
// Solutions sit above blocks — they compose blocks to serve business goals.
// Each solution contains tools that connect to blocks and services.

// ─── Solution Tool Action ─────────────────────────────────────────

export interface SolutionToolAction {
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

// ─── Solution Tool ────────────────────────────────────────────────

export type SolutionToolStatus = "active" | "beta" | "coming-soon";

export interface SolutionTool {
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
  status: SolutionToolStatus;
  /** Which blocks this tool composes */
  blocks: BlockConnection[];
  /** Agent keys this tool leverages (from agents block) */
  agentKeys?: string[];
  /** Actions this tool exposes */
  actions: SolutionToolAction[];
  /** Whether this tool has sub-routes beyond the main page */
  hasSubRoutes: boolean;
  /** File paths (relative to project root) */
  paths: {
    page: string;
    components?: string;
    api?: string;
  };
}

// ─── Solution Manifest ────────────────────────────────────────────

export interface SolutionManifest {
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
  /** Business domain this solution targets */
  domain: string;
  /** The tools within this solution */
  tools: SolutionTool[];
  /** High-level capabilities for the LLM */
  capabilities: string[];
  /** Sort order in navigation */
  sortOrder: number;
}
