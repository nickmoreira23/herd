import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { searchEntries } from "../../src/lib/handbook/search";
import type { IndexEntry } from "../../src/lib/handbook/search-index";

let cachedIndex: IndexEntry[] | null = null;

function loadIndex(): IndexEntry[] {
  if (cachedIndex) return cachedIndex;
  const path = resolve(__dirname, "../generated/search-index.json");
  const data = JSON.parse(readFileSync(path, "utf-8")) as {
    version: number;
    entries: IndexEntry[];
  };
  cachedIndex = data.entries;
  return cachedIndex;
}

export interface SearchResult {
  id: string;
  title: string;
  text: string;
  url: string;
}

/**
 * MCP search tool — wraps the shared lexical search and returns the
 * ChatGPT-compatible shape: { results: [{ id, title, text, url }] }.
 *
 * Locale is fixed to en-US for MCP callers (LLMs); the in-app dialog
 * uses the user's locale.
 */
export function executeSearch(query: string): { results: SearchResult[] } {
  const entries = loadIndex();
  const results = searchEntries(entries, query, { locale: "en-US", limit: 20 });
  return {
    results: results.map((r) => ({
      id: r.uid,
      title: r.title,
      text: r.description,
      url: `https://herd.com${r.url}`,
    })),
  };
}
