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

/** Fallback category id used when a block has no category in block_categories */
export const KNOWLEDGE_FALLBACK_CATEGORY_ID = "other";
export const KNOWLEDGE_FALLBACK_CATEGORY_LABEL = "Outros";

/**
 * One rendered group in the Knowledge view. Always derived from the global
 * `block_categories` setting — never persisted with a user-chosen order.
 */
export interface KnowledgeCategoryEntry {
  categoryId: string;
  blocks: string[];
}

interface CategoryLike {
  id: string;
  blocks: string[];
}

/** Find which category a block belongs to in block_categories, or null. */
export function findCategoryForBlock(
  blockName: string,
  categories: readonly CategoryLike[]
): string | null {
  for (const cat of categories) {
    if (cat.blocks.includes(blockName)) return cat.id;
  }
  return null;
}

/**
 * Normalize a raw Setting.knowledge_enabled_blocks value into a flat
 * Set of selected block names.
 *
 * Accepts:
 *   - flat array `["a","b"]`
 *   - comma-separated string `"a,b"` (legacy)
 *   - nested array `[{categoryId, blocks}]` (transitional)
 *   - null/undefined → all KNOWLEDGE_TYPE_BLOCKS
 */
export function parseKnowledgeBlocks(value: unknown): Set<string> {
  if (value == null) return new Set(KNOWLEDGE_TYPE_BLOCKS);

  let parsed: unknown = value;
  if (typeof parsed === "string") {
    const trimmed = parsed.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
      }
    } else {
      parsed = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  if (!Array.isArray(parsed)) return new Set(KNOWLEDGE_TYPE_BLOCKS);

  const out = new Set<string>();
  for (const entry of parsed) {
    if (typeof entry === "string") {
      out.add(entry);
    } else if (
      entry &&
      typeof entry === "object" &&
      "blocks" in entry &&
      Array.isArray((entry as { blocks: unknown[] }).blocks)
    ) {
      // Transitional nested format
      for (const b of (entry as { blocks: unknown[] }).blocks) {
        if (typeof b === "string") out.add(b);
      }
    }
  }
  return out;
}

/**
 * Group a set of selected block names into category buckets following the
 * global `block_categories` order. Categories with no selected blocks are
 * dropped. Blocks not found in any category fall into a "fallback" bucket.
 */
export function groupSelectedSources(
  selected: ReadonlySet<string>,
  categories: readonly CategoryLike[]
): KnowledgeCategoryEntry[] {
  const groups: KnowledgeCategoryEntry[] = [];
  const placed = new Set<string>();

  for (const cat of categories) {
    const blocks = cat.blocks.filter((b) => selected.has(b));
    blocks.forEach((b) => placed.add(b));
    if (blocks.length > 0) {
      groups.push({ categoryId: cat.id, blocks });
    }
  }

  const orphans = [...selected].filter((b) => !placed.has(b));
  if (orphans.length > 0) {
    groups.push({
      categoryId: KNOWLEDGE_FALLBACK_CATEGORY_ID,
      blocks: orphans,
    });
  }

  return groups;
}
