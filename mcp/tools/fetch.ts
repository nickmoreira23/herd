import { readFileSync } from "node:fs";
import { join } from "node:path";

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
  // cwd-relative for compatibility with both stdio and Next.js HTTP entrypoints.
  const path = join(process.cwd(), "mcp/generated/search-index.json");
  const data = JSON.parse(readFileSync(path, "utf-8")) as {
    version: number;
    entries: IndexEntry[];
  };
  cachedIndex = data.entries;
  return cachedIndex;
}

export interface FetchResult {
  id: string;
  title: string;
  text: string;
  url: string;
  metadata: {
    level: string;
    title_pt_BR: string;
    description_en_US: string;
    description_pt_BR: string;
    body_pt_BR: string;
  };
}

export function executeFetch(id: string): FetchResult | { error: string } {
  const idx = loadIndex();
  const entry = idx.find((e) => e.uid === id);
  if (!entry) {
    return { error: `No entry with UID '${id}'` };
  }
  return {
    id: entry.uid,
    title: entry.title_en_US,
    text: entry.body_en_US,
    url: `https://herd.com/admin/handbook/${entry.level}/${entry.id}`,
    metadata: {
      level: entry.level,
      title_pt_BR: entry.title_pt_BR,
      description_en_US: entry.description_en_US,
      description_pt_BR: entry.description_pt_BR,
      body_pt_BR: entry.body_pt_BR,
    },
  };
}
