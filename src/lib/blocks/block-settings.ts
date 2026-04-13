/**
 * Block page settings — two-tier configuration system.
 *
 * Global settings (block_global_settings) define defaults for ALL blocks.
 * Per-block overrides (block_settings_{name}) customize individual blocks.
 * Resolution: per-block > global > hardcoded defaults.
 *
 * Stored in the Setting table as JSON via /api/settings.
 */

export interface BlockPageSettings {
  /** Which view modes are available */
  enabledViews: string[];
  /** Default view mode when opening a block page */
  defaultView: string;
  /** Show stat cards above the content */
  showStats: boolean;
  /** Show the search bar in the toolbar */
  showSearch: boolean;
  /** Allow bulk row selection and actions */
  enableBulkActions: boolean;
}

/** All possible view types */
export const ALL_VIEW_TYPES = ["list", "card", "calendar", "kanban"] as const;
export type ViewType = (typeof ALL_VIEW_TYPES)[number];

/** View type labels for UI */
export const VIEW_TYPE_LABELS: Record<ViewType, string> = {
  list: "List",
  card: "Card",
  calendar: "Calendar",
  kanban: "Kanban",
};

/** Setting keys */
export const GLOBAL_BLOCK_SETTINGS_KEY = "block_global_settings";

export function blockSettingsKey(blockName: string): string {
  return `block_settings_${blockName}`;
}

/** Hardcoded defaults when no setting exists */
export const DEFAULT_BLOCK_PAGE_SETTINGS: BlockPageSettings = {
  enabledViews: ["list", "card", "calendar"],
  defaultView: "list",
  showStats: true,
  showSearch: true,
  enableBulkActions: true,
};

/** Resolve final settings: per-block > global > defaults */
export function resolveBlockSettings(
  global: Partial<BlockPageSettings> | null,
  perBlock: Partial<BlockPageSettings> | null,
): BlockPageSettings {
  return {
    ...DEFAULT_BLOCK_PAGE_SETTINGS,
    ...removeNulls(global),
    ...removeNulls(perBlock),
  };
}

function removeNulls(
  obj: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!obj) return {};
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v != null),
  );
}

/** Parse settings from a JSON setting value */
export function parseBlockSettings(
  value: unknown,
): Partial<BlockPageSettings> | null {
  if (!value) return null;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Partial<BlockPageSettings>;
    }
    return null;
  } catch {
    return null;
  }
}
