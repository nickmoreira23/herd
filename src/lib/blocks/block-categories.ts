/**
 * Block category system — groups blocks into labeled sections
 * for the sub-panel and All Blocks page.
 *
 * Categories are persisted in the Setting table under BLOCK_CATEGORIES_SETTING_KEY.
 * When no setting exists, DEFAULT_BLOCK_CATEGORIES is used.
 */

export interface BlockCategory {
  id: string;
  label: string;
  /** Ordered list of block names in this category */
  blocks: string[];
  /** Hex color for visual theming (e.g. "#3b82f6") */
  color?: string;
}

/** Setting key in the Setting table */
export const BLOCK_CATEGORIES_SETTING_KEY = "block_categories";

/** Preset color palette for categories */
export const CATEGORY_COLOR_PRESETS = [
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#10b981", // emerald
  "#f43f5e", // rose
  "#0ea5e9", // sky
  "#f97316", // orange
  "#14b8a6", // teal
  "#ec4899", // pink
  "#6366f1", // indigo
  "#84cc16", // lime
  "#64748b", // slate
];

/** Fallback color when category has none */
export const DEFAULT_CATEGORY_COLOR = "#64748b";

/** Convert hex to rgba string */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Default categories when no setting exists */
export const DEFAULT_BLOCK_CATEGORIES: BlockCategory[] = [
  {
    id: "core",
    label: "Core",
    color: "#3b82f6",
    blocks: ["pages", "products", "agents", "partners", "perks", "community", "messages"],
  },
  {
    id: "schedule",
    label: "Schedule",
    color: "#f59e0b",
    blocks: ["meetings", "events", "tasks"],
  },
  {
    id: "media",
    label: "Media",
    color: "#8b5cf6",
    blocks: ["documents", "images", "videos", "audios"],
  },
  {
    id: "data",
    label: "Data",
    color: "#10b981",
    blocks: ["tables", "forms", "links", "feeds", "apps"],
  },
];

/** Parse categories from a JSON setting value, with fallback to defaults */
export function parseBlockCategories(value: unknown): BlockCategory[] {
  if (!value) return DEFAULT_BLOCK_CATEGORIES;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.id && parsed[0]?.blocks) {
      return parsed as BlockCategory[];
    }
    return DEFAULT_BLOCK_CATEGORIES;
  } catch {
    return DEFAULT_BLOCK_CATEGORIES;
  }
}
