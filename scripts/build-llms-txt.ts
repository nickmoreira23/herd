/**
 * Generate /llms.txt from the Handbook search-index.
 *
 * Output: public/llms.txt (Next.js serves it at /llms.txt automatically).
 * Same deterministic pattern as the other gen:* scripts: same input
 * produces byte-identical output. Committed to the repo so production
 * deploy doesn't need to run gen:all.
 *
 * Format follows the llmstxt.org convention: a Markdown file with a
 * project name, a > blockquote summary, and sections of links.
 */

import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const SEARCH_INDEX_PATH = join(ROOT, "mcp/generated/search-index.json");
const OUTPUT_PATH = join(ROOT, "public/llms.txt");

const HERD_BASE_URL = "https://herd.app";

const LAYER_ORDER = [
  "networks",
  "solutions",
  "tools",
  "blocks",
  "integrations",
];

interface IndexEntry {
  uid: string;
  id: string;
  level: string;
  parent: string | null;
  title_en_US: string;
  description_en_US: string;
}

interface IndexFile {
  version: number;
  entries: IndexEntry[];
}

function layerOrder(id: string): number {
  const i = LAYER_ORDER.indexOf(id);
  return i === -1 ? 999 : i;
}

function urlForEntry(entry: IndexEntry): string {
  if (entry.level === "meta") return `${HERD_BASE_URL}/admin/handbook/meta/${entry.id}`;
  if (entry.level === "layer") return `${HERD_BASE_URL}/admin/handbook/${entry.id}`;
  if (entry.level === "category") {
    const layerId = entry.parent?.split(".").pop();
    return `${HERD_BASE_URL}/admin/handbook/${layerId}/${entry.id}`;
  }
  // feature individual
  const parts = entry.parent?.split(".") ?? [];
  const layerId = parts[2];
  const categoryId = parts[3];
  return `${HERD_BASE_URL}/admin/handbook/${layerId}/${categoryId}/${entry.id}`;
}

function buildLlmsTxt(): string {
  const data: IndexFile = JSON.parse(readFileSync(SEARCH_INDEX_PATH, "utf-8"));
  const entries = data.entries;

  const layers = entries
    .filter((e) => e.level === "layer")
    .sort((a, b) => layerOrder(a.id) - layerOrder(b.id));

  const categories = entries
    .filter((e) => e.level === "category")
    .sort((a, b) => {
      const layerA = a.parent?.split(".").pop() ?? "";
      const layerB = b.parent?.split(".").pop() ?? "";
      const order = layerOrder(layerA) - layerOrder(layerB);
      if (order !== 0) return order;
      return a.id.localeCompare(b.id);
    });

  const metas = entries
    .filter((e) => e.level === "meta")
    .sort((a, b) => a.id.localeCompare(b.id));

  const lines: string[] = [];

  lines.push("# HERD");
  lines.push("");
  lines.push("> HERD is an AI-native B2B platform for marketing networks.");
  lines.push(
    `> Currently ${entries.length} documented entries across 5 layers ` +
      `(Networks, Solutions, Tools, Blocks, Integrations) plus a meta namespace.`,
  );
  lines.push("");

  lines.push("## Documentation");
  lines.push("");
  lines.push(
    `- [Handbook home](${HERD_BASE_URL}/admin/handbook): Overview of the entire system, organized by layer.`,
  );
  lines.push("");

  if (layers.length > 0) {
    lines.push("## Layers");
    lines.push("");
    for (const layer of layers) {
      lines.push(
        `- [${layer.title_en_US}](${urlForEntry(layer)}): ${layer.description_en_US}`,
      );
    }
    lines.push("");
  }

  if (categories.length > 0) {
    lines.push("## Categories");
    lines.push("");
    for (const cat of categories) {
      lines.push(
        `- [${cat.title_en_US}](${urlForEntry(cat)}): ${cat.description_en_US}`,
      );
    }
    lines.push("");
  }

  if (metas.length > 0) {
    lines.push("## Meta");
    lines.push("");
    for (const meta of metas) {
      lines.push(
        `- [${meta.title_en_US}](${urlForEntry(meta)}): ${meta.description_en_US}`,
      );
    }
    lines.push("");
  }

  lines.push("## Programmatic access");
  lines.push("");
  lines.push(
    `The Handbook is also available via Model Context Protocol (MCP) server. ` +
      `See [MCP Server](${HERD_BASE_URL}/admin/handbook/meta/mcp) for stdio and HTTP ` +
      `transport details.`,
  );
  lines.push("");

  return lines.join("\n");
}

function main() {
  const content = buildLlmsTxt();
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, content, "utf-8");
  console.log(`✓ public/llms.txt regenerated`);
}

main();
