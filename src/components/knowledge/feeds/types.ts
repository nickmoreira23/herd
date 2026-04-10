export interface KnowledgeRSSFeedRow {
  id: string;
  feedUrl: string;
  siteUrl: string | null;
  name: string;
  description: string | null;
  faviconUrl: string | null;
  frequency: string;
  instructions: string | null;
  includeKeywords: string[];
  excludeKeywords: string[];
  maxEntriesPerSync: number;
  status: string;
  isActive: boolean;
  errorMessage: string | null;
  textContent: string | null;
  contentLength: number;
  chunkCount: number;
  entryCount: number;
  readyEntryCount: number;
  lastCheckedAt: string | null;
  lastNewEntryAt: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface KnowledgeRSSEntryRow {
  id: string;
  guid: string;
  title: string;
  author: string | null;
  summary: string | null;
  sourceUrl: string;
  publishedAt: string | null;
  categories: string[];
  imageUrl: string | null;
  status: string;
  contentLength: number;
  scrapedAt: string | null;
  createdAt: string;
}

export interface KnowledgeRSSFeedStats {
  total: number;
  active: number;
  processing: number;
  error: number;
  totalEntries: number;
}
