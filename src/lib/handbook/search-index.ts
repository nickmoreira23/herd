import { readFileSync } from "node:fs";
import { join } from "node:path";

export type IndexLevel =
  | "layer"
  | "category"
  | "meta"
  | "network"
  | "solution"
  | "tool"
  | "block"
  | "integration";

export interface IndexEntry {
  uid: string;
  id: string;
  level: IndexLevel;
  parent: string | null;
  status: string;
  owners: string[];
  since: string;
  updated: string;
  consumes: string[];
  consumed_by: string[];
  related: string[];
  source_paths: string[];
  admin_paths: string[];
  title_pt_BR: string;
  title_en_US: string;
  description_pt_BR: string;
  description_en_US: string;
  body_pt_BR: string;
  body_en_US: string;
}

interface IndexFile {
  version: number;
  entries: IndexEntry[];
}

let cachedIndex: IndexEntry[] | null = null;

export function getIndex(): IndexEntry[] {
  if (cachedIndex) return cachedIndex;
  const path = join(process.cwd(), "mcp/generated/search-index.json");
  const data = JSON.parse(readFileSync(path, "utf-8")) as IndexFile;
  cachedIndex = data.entries;
  return cachedIndex;
}

export function findByUid(uid: string): IndexEntry | undefined {
  return getIndex().find((e) => e.uid === uid);
}

const LAYER_ORDER = ["networks", "solutions", "tools", "blocks", "integrations"];
function layerSortOrder(id: string): number {
  const i = LAYER_ORDER.indexOf(id);
  return i === -1 ? 999 : i;
}

const FEATURE_LEVELS = new Set(["network", "solution", "tool", "block", "integration"]);

export function getLayers(): IndexEntry[] {
  return getIndex()
    .filter((e) => e.level === "layer")
    .sort((a, b) => layerSortOrder(a.id) - layerSortOrder(b.id));
}

export function getCategoriesOf(layerUid: string): IndexEntry[] {
  return getIndex()
    .filter((e) => e.level === "category" && e.parent === layerUid)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function getFeaturesOf(categoryUid: string): IndexEntry[] {
  return getIndex()
    .filter((e) => FEATURE_LEVELS.has(e.level) && e.parent === categoryUid)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function getMetaEntries(): IndexEntry[] {
  return getIndex()
    .filter((e) => e.level === "meta")
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Tag IndexEntry shape into the ChildItem shape (entry + computed href).
 * Server-side helper — keeps href computation out of Client Components.
 */
export function toChildItems(
  entries: IndexEntry[],
  hrefFor: (e: IndexEntry) => string,
): Array<{
  uid: string;
  href: string;
  title_pt_BR: string;
  title_en_US: string;
  description_pt_BR: string;
  description_en_US: string;
}> {
  return entries.map((e) => ({
    uid: e.uid,
    href: hrefFor(e),
    title_pt_BR: e.title_pt_BR,
    title_en_US: e.title_en_US,
    description_pt_BR: e.description_pt_BR,
    description_en_US: e.description_en_US,
  }));
}

/**
 * Filesystem path (relative to handbookRoot) for an entry.
 *
 * Layouts:
 *   layer:    {layer}/(overview)
 *   category: {layer}/{category}/(overview)
 *   feature:  {layer}/{category}/{id}
 *   meta:     _meta/{id}
 */
export function entryFilesystemPath(uid: string): string | null {
  const entry = findByUid(uid);
  if (!entry) return null;

  if (entry.level === "meta") return `_meta/${entry.id}`;
  if (entry.level === "layer") return `${entry.id}/(overview)`;

  if (entry.level === "category") {
    const layerId = entry.parent?.split(".").pop();
    if (!layerId) return null;
    return `${layerId}/${entry.id}/(overview)`;
  }

  // feature: parent is herd.category.{layer}.{category}, 4 segments
  const parts = entry.parent?.split(".") ?? [];
  if (parts.length !== 4) return null;
  const layerId = parts[2];
  const categoryId = parts[3];
  return `${layerId}/${categoryId}/${entry.id}`;
}
