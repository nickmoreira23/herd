// Projections XLSX export — public surface.
//
// `buildAllSheets` is the pure orchestrator (used by the reconciliation
// test and the UI). `exportProjectionsToXlsx` ties it to the ExcelJS
// renderer + browser download.

import { PROJECTION_MONTHS, type FinancialInputs, type ScenarioResults } from "@/lib/financial-engine";
import type { ExportSheet, ExportTranslate } from "./types";
import { buildProjectionSheet } from "./build-projection-sheet";
import { buildCohortAggregateSheet } from "./build-cohort-aggregate-sheet";
import { buildCohortLifecycleSheet } from "./build-cohort-lifecycle-sheet";
import { sheetsToWorkbookBuffer, triggerDownload } from "./workbook";

export type { ExportSheet } from "./types";
export { buildProjectionSheet } from "./build-projection-sheet";
export { buildCohortAggregateSheet } from "./build-cohort-aggregate-sheet";
export { buildCohortLifecycleSheet } from "./build-cohort-lifecycle-sheet";
export { sheetsToWorkbookBuffer, triggerDownload } from "./workbook";

/**
 * Build every export sheet from a scenario: the projection, the cohort
 * aggregate, and one lifecycle sheet per acquisition cohort that actually
 * onboarded subscribers (netNewSubs > 0). A single click yields a workbook
 * whose tabs cover all three views the user asked for.
 */
export function buildAllSheets(
  results: ScenarioResults,
  inputs: FinancialInputs,
  t: ExportTranslate,
  months: number = PROJECTION_MONTHS,
): ExportSheet[] {
  const sheets: ExportSheet[] = [
    buildProjectionSheet(results, inputs, months, t),
    buildCohortAggregateSheet(results, inputs, months, t),
  ];

  for (const cohort of results.cohortLifecycles ?? []) {
    if (cohort.netNewSubs > 0) {
      sheets.push(buildCohortLifecycleSheet(cohort, t));
    }
  }

  return sheets;
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim().replace(/\s+/g, "-");
  return cleaned || "projections";
}

/**
 * Build the workbook and trigger a browser download. Client-only.
 */
export async function exportProjectionsToXlsx(
  results: ScenarioResults,
  inputs: FinancialInputs,
  t: ExportTranslate,
  opts?: { scenarioName?: string; months?: number },
): Promise<void> {
  const sheets = buildAllSheets(results, inputs, t, opts?.months);
  const buffer = await sheetsToWorkbookBuffer(sheets);
  const stamp = new Date().toISOString().slice(0, 10);
  const base = sanitizeFilename(opts?.scenarioName ?? "projections");
  triggerDownload(buffer, `${base}-${stamp}.xlsx`);
}
