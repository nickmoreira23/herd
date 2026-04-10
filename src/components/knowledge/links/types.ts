export interface KnowledgeLinkRow {
  id: string;
  url: string;
  name: string;
  description: string | null;
  domain: string;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  scrapeMode: string;
  maxPages: number;
  pagesDiscovered: number;
  pagesScraped: number;
  pagesErrored: number;
  status: string;
  isActive: boolean;
  errorMessage: string | null;
  textContent: string | null;
  contentLength: number;
  chunkCount: number;
  lastScrapedAt: string | null;
  createdAt: string;
  processedAt: string | null;
  pages?: KnowledgeLinkPageRow[];
}

export interface KnowledgeLinkPageRow {
  id: string;
  url: string;
  path: string;
  title: string | null;
  status: string;
  contentLength: number;
  depth: number;
  scrapedAt: string | null;
}

export interface KnowledgeLinkStats {
  total: number;
  pending: number;
  processing: number;
  ready: number;
  error: number;
}
