// ─── Shared types for the data retrieval system ────────────────────

export interface CatalogItem {
  id: string; // "type:uuid"
  type: string; // "document", "product", "agent", etc.
  domain: string; // "knowledge" | "foundation"
  name: string;
  description: string | null;
  contentLength: number;
  extra?: string;
}

export interface SearchParams {
  item_ids?: string[]; // format: "type:uuid" e.g. "document:abc-123"
  keyword?: string;
  types?: string[];
}

export interface SearchResult {
  id: string;
  type: string;
  name: string;
  content: string;
}

export interface ArtifactMeta {
  id: string; // "product:uuid" format
  type: string; // "product", "agent", "document", etc.
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  status?: string | null;
  category?: string | null;
  meta: Record<string, unknown>; // Type-specific fields
}

export interface DataProvider {
  domain: string;
  types: string[];
  getCatalogItems(): Promise<CatalogItem[]>;
  fetchByIds(grouped: Record<string, string[]>): Promise<SearchResult[]>;
  searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]>;
  getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]>;
}

export const MAX_CONTENT_LENGTH = 40_000;

export function truncate(
  text: string | null,
  max = MAX_CONTENT_LENGTH
): string {
  if (!text) return "(no content)";
  if (text.length <= max) return text;
  return (
    text.slice(0, max) +
    `\n\n[... truncated, ${text.length - max} characters omitted]`
  );
}
