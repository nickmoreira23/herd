/**
 * Shared constants for knowledge-type blocks.
 * Folder types, document statuses, allowed file types, etc.
 */

// ─── Folder Types ────────────────────────────────────────────────────
export const KNOWLEDGE_FOLDER_TYPES = ["DOCUMENT", "IMAGE", "VIDEO", "AUDIO"] as const;
export type KnowledgeFolderType = (typeof KNOWLEDGE_FOLDER_TYPES)[number];

// ─── Document Status Lifecycle ───────────────────────────────────────
export const KNOWLEDGE_STATUSES = ["PENDING", "PROCESSING", "READY", "ERROR"] as const;
export type KnowledgeStatus = (typeof KNOWLEDGE_STATUSES)[number];

// ─── Allowed File Types ──────────────────────────────────────────────
export const DOCUMENT_FILE_TYPES = ["PDF", "DOCX", "TXT", "MD", "CSV"] as const;
export const IMAGE_FILE_TYPES = ["PNG", "JPG", "WEBP", "GIF", "SVG", "TIFF"] as const;
export const VIDEO_FILE_TYPES = ["MP4", "MOV", "WEBM", "AVI"] as const;
export const AUDIO_FILE_TYPES = ["MP3", "WAV", "OGG", "FLAC", "AAC", "M4A"] as const;

// ─── Knowledge Meta-Feature ──────────────────────────────────────────

/** All block names that can be composed by the knowledge meta-feature */
export const KNOWLEDGE_TYPE_BLOCKS = [
  "documents",
  "images",
  "videos",
  "audios",
  "tables",
  "forms",
  "links",
  "feeds",
  "apps",
] as const;

export type KnowledgeTypeBlock = (typeof KNOWLEDGE_TYPE_BLOCKS)[number];

/** Setting key in the Setting table for enabled knowledge blocks */
export const KNOWLEDGE_BLOCKS_SETTING_KEY = "knowledge_enabled_blocks";

/** Default value when no setting exists — all blocks enabled */
export const DEFAULT_KNOWLEDGE_BLOCKS = KNOWLEDGE_TYPE_BLOCKS.join(",");
