import type {
  ToolCategoryManifest,
  Tool,
  ToolAction,
} from "./manifest";
import { blockRegistry } from "../blocks/registry";
import { financesCategory } from "./categories/finances.category";
import { legalCategory } from "./categories/legal.category";
import { marketingCategory } from "./categories/marketing.category";
import { operationsCategory } from "./categories/operations.category";
import { salesCategory } from "./categories/sales.category";
import { chatTool } from "./tools/chat.tool";
import { dashboardTool } from "./tools/dashboard.tool";
import { handbookTool } from "./tools/handbook.tool";
import { knowledgeTool } from "./tools/knowledge.tool";
import { ledgerTool } from "./tools/ledger.tool";
import { marketplaceTool } from "./tools/marketplace.tool";
import { organizationTool } from "./tools/organization.tool";
import { profileTool } from "./tools/profile.tool";

// ─── All registered tool categories ───────────────────────────────
// To add a new category, create a manifest and add it here.

const categories: ToolCategoryManifest[] = [
  legalCategory,
  marketingCategory,
  salesCategory,
  operationsCategory,
  financesCategory,
].sort((a, b) => a.sortOrder - b.sortOrder);

// ─── Lookup Maps ──────────────────────────────────────────────────

/** Category name → manifest */
export const toolCategoryRegistry = new Map<string, ToolCategoryManifest>(
  categories.map((c) => [c.name, c])
);

/** Tool name → { category, tool } */
export const toolToCategory = new Map<
  string,
  { category: ToolCategoryManifest; tool: Tool }
>();
for (const category of categories) {
  for (const tool of category.tools) {
    toolToCategory.set(tool.name, { category, tool });
  }
}

/** Tool action name → { category, tool, action } */
export const toolActionToCategory = new Map<
  string,
  {
    category: ToolCategoryManifest;
    tool: Tool;
    action: ToolAction;
  }
>();
for (const category of categories) {
  for (const tool of category.tools) {
    for (const action of tool.actions) {
      toolActionToCategory.set(action.name, { category, tool, action });
    }
  }
}

/** Block name → categories that depend on it */
export const blockToCategories = new Map<string, ToolCategoryManifest[]>();
for (const category of categories) {
  for (const tool of category.tools) {
    for (const conn of tool.blocks) {
      const existing = blockToCategories.get(conn.blockName) || [];
      if (!existing.includes(category)) {
        existing.push(category);
      }
      blockToCategories.set(conn.blockName, existing);
    }
  }
}

// ─── Public Helpers ───────────────────────────────────────────────

export function getAllToolCategories(): ToolCategoryManifest[] {
  return categories;
}

export function getActiveToolCategories(): ToolCategoryManifest[] {
  return categories.filter((c) =>
    c.tools.some((t) => t.status !== "coming-soon")
  );
}

export function getCategoryTools(categoryName: string): Tool[] {
  return toolCategoryRegistry.get(categoryName)?.tools ?? [];
}

export function getActiveTools(categoryName: string): Tool[] {
  return getCategoryTools(categoryName).filter(
    (t) => t.status !== "coming-soon"
  );
}

/**
 * Builds a text catalog of all tool actions for the LLM system prompt.
 * Grouped by category > tool with action descriptions.
 */
export function buildToolActionCatalog(): string {
  const sections = categories
    .filter((c) => c.tools.some((t) => t.actions.length > 0))
    .map((category) => {
      const toolSections = category.tools
        .filter((t) => t.actions.length > 0 && t.status !== "coming-soon")
        .map((tool) => {
          const actionLines = tool.actions.map((a) => {
            const required = a.requiredFields?.length
              ? ` (required: ${a.requiredFields.join(", ")})`
              : "";
            return `    - ${a.name}: ${a.description}${required}`;
          });
          return `  ${tool.displayName} [${tool.name}]:\n${actionLines.join("\n")}`;
        });
      return `${category.displayName} Category [${category.name}]:\n${toolSections.join("\n\n")}`;
    });
  return sections.join("\n\n");
}

// ─── Standalone Tools (cross-cutting, not in any business category) ──

const standaloneTools: Record<string, Tool> = {
  chat: chatTool,
  dashboard: dashboardTool,
  handbook: handbookTool,
  knowledge: knowledgeTool,
  ledger: ledgerTool,
  marketplace: marketplaceTool,
  organization: organizationTool,
  profile: profileTool,
};

function flattenCategoryTools(): Record<string, Tool> {
  const flat: Record<string, Tool> = {};
  for (const category of toolCategoryRegistry.values()) {
    for (const tool of category.tools) {
      flat[tool.name] = tool;
    }
  }
  return flat;
}

/** Unified lookup combining tools embedded in categories + standalone tools. */
export const allTools: Record<string, Tool> = {
  ...flattenCategoryTools(),
  ...standaloneTools,
};

/**
 * Validates that all block references in tool category manifests exist in
 * the block registry. Returns an array of error messages (empty = all valid).
 */
export function validateToolCategoryDependencies(): string[] {
  const errors: string[] = [];
  for (const category of categories) {
    for (const tool of category.tools) {
      for (const conn of tool.blocks) {
        if (!blockRegistry.has(conn.blockName)) {
          errors.push(
            `${category.name}/${tool.name} references unknown block "${conn.blockName}"`
          );
        }
      }
    }
  }
  return errors;
}
