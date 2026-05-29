import type { MessageKey } from "@/lib/i18n/t";

// Shared model for the Projections XLSX export.
//
// The three views (projection, cohort aggregate, single-cohort lifecycle)
// re-derive their numbers from `ScenarioResults`/`FinancialInputs` and emit
// this neutral `ExportSheet` shape. `workbook.ts` turns a list of
// `ExportSheet` into an ExcelJS workbook.
//
// Why a separate model instead of reusing the table components' `RowDef`:
// the three on-screen tables have heterogeneous internal shapes
// (`values[]` vs `getValue(m)` accessors) and live inside governed
// engine-consumer components (see .agents/skills/practice-financial-engine).
// The export is additive — it must not touch those components — so it
// re-derives into this flat shape. Drift is guarded by
// `__tests__/export-reconciliation.test.ts`, which pins the export's
// revenue totals to the same audit values the engine is pinned to
// ($879,956 accrual / $990,498 cash).

/** Cell formatting bucket — mirrors the table `RowType`. */
export type ExportCellType = "currency" | "number" | "decimal" | "percent";

/** How the trailing Total/Avg column is computed from `values`. */
export type ExportTotalMode = "sum" | "average" | "latest";

export interface ExportRow {
  label: string;
  type: ExportCellType;
  /** One value per data column (e.g. one per month). */
  values: number[];
  /** Drives the Total column. */
  totalMode: ExportTotalMode;
  /** Indent depth for the label cell (0 = top-level). */
  level?: 0 | 1 | 2;
  /** Render the row bold (headline rows). */
  bold?: boolean;
}

export interface ExportSection {
  header: string;
  rows: ExportRow[];
}

export interface ExportSheet {
  /** Worksheet tab name. ExcelJS caps at 31 chars; `workbook.ts` truncates. */
  name: string;
  /**
   * Data-column headers (NOT including the leading "Metric" column nor the
   * trailing "Total" column — `workbook.ts` adds both). Length must match
   * every row's `values.length`.
   */
  columnHeaders: string[];
  /** Label for the trailing total column (e.g. "Total" / "Lifetime"). */
  totalHeader: string;
  sections: ExportSection[];
}

/**
 * Translator contract the builders need — the same `MessageKey`-typed shape
 * as `useT()`, so the app's `t` passes straight through and every key the
 * builders emit is checked against the dictionary. A `(key: string) => string`
 * stub is still assignable (MessageKey ⊆ string), keeping the builders
 * unit-testable without an i18n context.
 */
export type ExportTranslate = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

export function computeTotal(values: number[], mode: ExportTotalMode): number {
  if (values.length === 0) return 0;
  switch (mode) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "average":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "latest":
      return values[values.length - 1];
  }
}
