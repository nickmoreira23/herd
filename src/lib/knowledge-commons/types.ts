/**
 * Shared row types used by media blocks (documents, images, videos, audios)
 * and the knowledge folder system.
 *
 * These were originally in src/components/knowledge/types.ts and are now
 * the canonical source. Individual blocks re-export from here.
 */

export interface KnowledgeDocumentRow {
  id: string;
  name: string;
  description: string | null;
  fileType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  folderId: string | null;
  status: string;
  isActive: boolean;
  errorMessage: string | null;
  chunkCount: number;
  uploadedAt: string;
  processedAt: string | null;
  sourceFeature: string | null;
}

export interface KnowledgeImageRow {
  id: string;
  name: string;
  description: string | null;
  fileType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  folderId: string | null;
  status: string;
  isActive: boolean;
  errorMessage: string | null;
  chunkCount: number;
  textContent: string | null;
  uploadedAt: string;
  processedAt: string | null;
  sourceFeature: string | null;
}

export interface KnowledgeVideoRow {
  id: string;
  name: string;
  description: string | null;
  fileType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  duration: number | null;
  thumbnailUrl: string | null;
  folderId: string | null;
  status: string;
  isActive: boolean;
  errorMessage: string | null;
  chunkCount: number;
  textContent: string | null;
  uploadedAt: string;
  processedAt: string | null;
  sourceFeature: string | null;
}

export interface KnowledgeAudioRow {
  id: string;
  name: string;
  description: string | null;
  fileType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  duration: number | null;
  folderId: string | null;
  status: string;
  isActive: boolean;
  errorMessage: string | null;
  chunkCount: number;
  textContent: string | null;
  uploadedAt: string;
  processedAt: string | null;
  sourceFeature: string | null;
}

export interface KnowledgeFolderRow {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  sortOrder: number;
  createdAt: string;
  _count: {
    documents: number;
    images: number;
    videos: number;
    audios: number;
    children: number;
  };
}

// ─── Short aliases for block-standard naming ────────────────────────
// New block components use these; Knowledge-prefixed names kept for backward compat.

export type DocumentRow = KnowledgeDocumentRow;
export type ImageRow = KnowledgeImageRow;
export type VideoRow = KnowledgeVideoRow;
export type AudioRow = KnowledgeAudioRow;
export type FolderRow = KnowledgeFolderRow;
