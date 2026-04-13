import type { ColumnDef } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// ─── Stat Card ──────────────────────────────────────────────────────

export interface StatCard {
  label: string;
  value: string;
  subtext?: string;
  colorClass?: string;
}

// ─── Filter ─────────────────────────────────────────────────────────

export interface FilterDef<TData = unknown> {
  /** Key used for state tracking and default field accessor */
  key: string;
  /** Placeholder label, e.g. "All Statuses" */
  label: string;
  /** Dropdown options */
  options: { value: string; label: string }[];
  /** Custom filter function (default: item[key] === value) */
  filterFn?: (item: TData, value: string) => boolean;
}

// ─── View Modes ─────────────────────────────────────────────────────

export interface AdditionalViewDef<TData> {
  type: "card" | "calendar" | "kanban";
  /** Custom render function for this view */
  render: (data: TData[]) => ReactNode;
}

// ─── Bulk Actions ───────────────────────────────────────────────────

export interface BulkActionDef {
  key: string;
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "destructive";
  handler: (selectedIds: string[]) => Promise<void>;
}

// ─── Block List Page Config ─────────────────────────────────────────

export interface BlockListPageConfig<TData> {
  // ── Identity ──
  blockName: string;
  title: string;
  description?: string;

  // ── Data ──
  data: TData[];
  /** Extract the unique ID from a row (for bulk actions) */
  getId: (item: TData) => string;

  // ── List view (always supported) ──
  columns: ColumnDef<TData, unknown>[];
  enableRowSelection?: boolean;
  onRowClick?: (item: TData) => void;

  // ── Search ──
  searchPlaceholder?: string;
  searchFn?: (item: TData, query: string) => boolean;
  /** Controlled search — parent manages search state (for folder-aware blocks) */
  search?: string;
  onSearchChange?: (query: string) => void;

  // ── Filters ──
  filters?: FilterDef<TData>[];

  // ── Stats ──
  stats?: StatCard[];

  // ── Additional views beyond list ──
  additionalViews?: AdditionalViewDef<TData>[];

  // ── Header actions (right side — create button, etc.) ──
  headerActions?: ReactNode;

  // ── Bulk actions (when rows selected) ──
  bulkActions?: BulkActionDef[];

  // ── Slots ──
  beforeContent?: ReactNode;
  afterToolbar?: ReactNode;
  /** Extra elements rendered in the toolbar row between filters and search */
  toolbarExtras?: ReactNode;
  modals?: ReactNode;

  // ── Empty state ──
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;

  // ── Agent panel ──
  showAgent?: boolean;
}
