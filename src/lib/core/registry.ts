/**
 * Area registry — lookup for areas + tools-by-area helper.
 *
 * Stub in Commit 1 of R2 — area manifests cravados em Commit 2.
 * Tools-by-area lookup consume external Tool[] (from toolRegistry) to
 * avoid circular import between core/ and tools/.
 */

import type { Tool } from "@/lib/tools/manifest";
import type { AreaManifest } from "./manifest";

// Stub — populated in Commit 2 with 6 area manifests.
export const areaRegistry: Record<string, AreaManifest> = {};

export function getAllAreas(): AreaManifest[] {
  return Object.values(areaRegistry).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
}

export function getAreaByName(name: string): AreaManifest | undefined {
  return areaRegistry[name];
}

/**
 * Filter tools by area. Pass `Object.values(toolRegistry)` from
 * `@/lib/tools/registry` to populate the candidate list.
 */
export function getToolsByArea(areaName: string, tools: Tool[]): Tool[] {
  return tools.filter((t) => t.area === areaName);
}
