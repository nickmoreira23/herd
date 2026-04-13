/**
 * Re-export from canonical location.
 * This file is kept for backward compatibility during the block migration.
 * New code should import from @/lib/knowledge-commons/types.
 */
export type {
  KnowledgeDocumentRow,
  KnowledgeImageRow,
  KnowledgeVideoRow,
  KnowledgeAudioRow,
  KnowledgeFolderRow,
  // Short aliases
  DocumentRow,
  ImageRow,
  VideoRow,
  AudioRow,
  FolderRow,
} from "@/lib/knowledge-commons/types";
