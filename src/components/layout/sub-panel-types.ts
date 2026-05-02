import type { LucideIcon } from "lucide-react";

/**
 * Shared types for the sub-panel framework.
 *
 * Extracted from `sub-panel.tsx` to avoid circular dependencies between the
 * generic sub-panel renderer and feature-specific sub-panel components like
 * `NetworkSubPanel`. New extracted sub-panels (BlocksSubPanel,
 * KnowledgeSubPanel, etc.) should import from here.
 */

export const SUB_PANEL_WIDTH = 240; // px

export interface SubPanelLink {
  href: string;
  label: string;
  /**
   * Optional i18n key. When present, takes precedence over `label`.
   * Type kept loose (`string`) to avoid coupling sub-panel registry to
   * the entire MessageKey union; the renderer casts at lookup time.
   */
  labelKey?: string;
  icon?: LucideIcon;
}

export interface SubPanelCategory {
  id: string;
  label: string;
  /** Optional translation key. When present, takes precedence over `label`. */
  labelKey?: string;
  links: SubPanelLink[];
}

export interface SubPanelConfig {
  id: string;
  label: string;
  /** Optional translation key. When present, takes precedence over `label`. */
  labelKey?: string;
  links: SubPanelLink[];
  categories?: SubPanelCategory[];
}
