/**
 * Pure search logic shared between the in-app search dialog (UI) and
 * the MCP server (mcp/tools/search.ts). Receives entries pre-loaded by
 * the caller; no runtime dependency on Node or browser APIs.
 */

import type { IndexEntry } from "./search-index";
import { hrefForEntry } from "./href-for-entry";

export interface SearchResult {
  uid: string;
  id: string;
  title: string;
  description: string;
  /** ~200 chars around first body match, with <mark> on the term. HTML-escaped. */
  snippet: string;
  url: string;
  score: number;
}

export interface SearchOptions {
  locale: "pt-BR" | "en-US";
  limit?: number;
}

export function searchEntries(
  entries: IndexEntry[],
  query: string,
  options: SearchOptions,
): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const limit = options.limit ?? 20;

  const scored = entries
    .map((entry) => ({ entry, score: scoreEntry(entry, q, options.locale) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ entry, score }) => ({
    uid: entry.uid,
    id: entry.id,
    title: options.locale === "pt-BR" ? entry.title_pt_BR : entry.title_en_US,
    description:
      options.locale === "pt-BR"
        ? entry.description_pt_BR
        : entry.description_en_US,
    snippet: makeSnippet(entry, q, options.locale),
    url: hrefForEntry(entry),
    score,
  }));
}

function scoreEntry(
  entry: IndexEntry,
  q: string,
  locale: "pt-BR" | "en-US",
): number {
  let s = 0;
  const title = locale === "pt-BR" ? entry.title_pt_BR : entry.title_en_US;
  const description =
    locale === "pt-BR" ? entry.description_pt_BR : entry.description_en_US;
  const body = locale === "pt-BR" ? entry.body_pt_BR : entry.body_en_US;

  if (entry.uid.toLowerCase().includes(q)) s += 10;
  if (entry.id.toLowerCase().includes(q)) s += 8;
  if (title.toLowerCase().includes(q)) s += 5;
  if (description.toLowerCase().includes(q)) s += 3;
  if (body.toLowerCase().includes(q)) s += 1;
  return s;
}

function makeSnippet(
  entry: IndexEntry,
  q: string,
  locale: "pt-BR" | "en-US",
): string {
  const body = locale === "pt-BR" ? entry.body_pt_BR : entry.body_en_US;
  const description =
    locale === "pt-BR" ? entry.description_pt_BR : entry.description_en_US;

  const lowerBody = body.toLowerCase();
  const idx = lowerBody.indexOf(q);

  if (idx === -1) {
    return escapeHtml(description.slice(0, 200));
  }

  const radius = 100;
  const start = Math.max(0, idx - radius);
  const end = Math.min(body.length, idx + q.length + radius);
  const segment = body.slice(start, end);

  const prefix = start > 0 ? "…" : "";
  const suffix = end < body.length ? "…" : "";

  const escaped = escapeHtml(segment);
  // Highlight via case-insensitive regex over escaped term.
  const escapedQ = escapeRegex(escapeHtml(q));
  const highlighted = escaped.replace(
    new RegExp(escapedQ, "gi"),
    (match) => `<mark>${match}</mark>`,
  );

  return prefix + highlighted + suffix;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
