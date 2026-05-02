import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface IndexEntry {
  uid: string;
  id: string;
  level: string;
  title_pt_BR: string;
  title_en_US: string;
  description_pt_BR: string;
  description_en_US: string;
  body_pt_BR: string;
  body_en_US: string;
}

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

function score(entry: IndexEntry, query: string): number {
  const q = query.toLowerCase();
  let s = 0;

  if (entry.uid.toLowerCase().includes(q)) s += 10;
  if (entry.id.toLowerCase().includes(q)) s += 8;
  if (entry.title_en_US.toLowerCase().includes(q)) s += 5;
  if (entry.title_pt_BR.toLowerCase().includes(q)) s += 5;

  if (entry.description_en_US.toLowerCase().includes(q)) s += 3;
  if (entry.description_pt_BR.toLowerCase().includes(q)) s += 3;

  if (entry.body_en_US.toLowerCase().includes(q)) s += 1;
  if (entry.body_pt_BR.toLowerCase().includes(q)) s += 1;

  return s;
}

export interface SearchResult {
  id: string;
  title: string;
  text: string;
  url: string;
}

export function executeSearch(query: string): { results: SearchResult[] } {
  const idx = loadIndex();
  const scored = idx
    .map((e) => ({ entry: e, s: score(e, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 20);

  const results: SearchResult[] = scored.map(({ entry }) => ({
    id: entry.uid,
    title: entry.title_en_US,
    text: entry.description_en_US,
    url: `https://herd.com/admin/handbook/${entry.level}/${entry.id}`,
  }));

  return { results };
}
