import type {
  SolutionManifest,
  SolutionTool,
  SolutionToolAction,
} from "./manifest";
import { blockRegistry } from "../blocks/registry";
import { financesSolution } from "./solutions/finances.solution";
import { legalSolution } from "./solutions/legal.solution";
import { marketingSolution } from "./solutions/marketing.solution";
import { salesSolution } from "./solutions/sales.solution";

// ─── All registered solutions ─────────────────────────────────────
// To add a new solution, create a manifest and add it here.

const solutions: SolutionManifest[] = [
  legalSolution,
  marketingSolution,
  salesSolution,
  financesSolution,
].sort((a, b) => a.sortOrder - b.sortOrder);

// ─── Lookup Maps ──────────────────────────────────────────────────

/** Solution name → manifest */
export const solutionRegistry = new Map<string, SolutionManifest>(
  solutions.map((s) => [s.name, s])
);

/** Tool name → { solution, tool } */
export const toolToSolution = new Map<
  string,
  { solution: SolutionManifest; tool: SolutionTool }
>();
for (const solution of solutions) {
  for (const tool of solution.tools) {
    toolToSolution.set(tool.name, { solution, tool });
  }
}

/** Tool action name → { solution, tool, action } */
export const toolActionToSolution = new Map<
  string,
  {
    solution: SolutionManifest;
    tool: SolutionTool;
    action: SolutionToolAction;
  }
>();
for (const solution of solutions) {
  for (const tool of solution.tools) {
    for (const action of tool.actions) {
      toolActionToSolution.set(action.name, { solution, tool, action });
    }
  }
}

/** Block name → solutions that depend on it */
export const blockToSolutions = new Map<string, SolutionManifest[]>();
for (const solution of solutions) {
  for (const tool of solution.tools) {
    for (const conn of tool.blocks) {
      const existing = blockToSolutions.get(conn.blockName) || [];
      if (!existing.includes(solution)) {
        existing.push(solution);
      }
      blockToSolutions.set(conn.blockName, existing);
    }
  }
}

// ─── Public Helpers ───────────────────────────────────────────────

export function getAllSolutions(): SolutionManifest[] {
  return solutions;
}

export function getActiveSolutions(): SolutionManifest[] {
  return solutions.filter((s) =>
    s.tools.some((t) => t.status !== "coming-soon")
  );
}

export function getSolutionTools(solutionName: string): SolutionTool[] {
  return solutionRegistry.get(solutionName)?.tools ?? [];
}

export function getActiveTools(solutionName: string): SolutionTool[] {
  return getSolutionTools(solutionName).filter(
    (t) => t.status !== "coming-soon"
  );
}

/**
 * Builds a text catalog of all solution tool actions for the LLM system prompt.
 * Grouped by solution > tool with action descriptions.
 */
export function buildSolutionActionCatalog(): string {
  const sections = solutions
    .filter((s) => s.tools.some((t) => t.actions.length > 0))
    .map((solution) => {
      const toolSections = solution.tools
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
      return `${solution.displayName} Solution [${solution.name}]:\n${toolSections.join("\n\n")}`;
    });
  return sections.join("\n\n");
}

/**
 * Validates that all block references in solution manifests exist in the block registry.
 * Returns an array of error messages (empty = all valid).
 */
export function validateSolutionDependencies(): string[] {
  const errors: string[] = [];
  for (const solution of solutions) {
    for (const tool of solution.tools) {
      for (const conn of tool.blocks) {
        if (!blockRegistry.has(conn.blockName)) {
          errors.push(
            `${solution.name}/${tool.name} references unknown block "${conn.blockName}"`
          );
        }
      }
    }
  }
  return errors;
}
