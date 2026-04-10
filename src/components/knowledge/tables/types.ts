export interface KnowledgeTableRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  isActive: boolean;
  errorMessage: string | null;
  textContent: string | null;
  contentLength: number;
  chunkCount: number;
  recordCount: number;
  fieldCount: number;
  processedAt: string | null;
  sourceType: string | null;
  sourceId: string | null;
  sourceImportedAt: string | null;
  createdAt: string;
}

export interface KnowledgeTableStats {
  total: number;
  pending: number;
  processing: number;
  ready: number;
  error: number;
  totalRecords: number;
}

export interface KnowledgeTableFieldRow {
  id: string;
  tableId: string;
  name: string;
  type: string;
  description: string | null;
  options: Record<string, unknown> | null;
  isPrimary: boolean;
  isRequired: boolean;
  sortOrder: number;
}

export interface KnowledgeTableRecordRow {
  id: string;
  tableId: string;
  data: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
