// ExcelJS rendering for the Projections export.
//
// Turns the neutral `ExportSheet[]` model into a styled .xlsx workbook:
// one worksheet per sheet, a leading "Metric" column, one column per data
// point, and a trailing computed Total/Lifetime column. Section headers are
// bold filled rows; indented child rows get leading spaces.

import ExcelJS from "exceljs";
import { computeTotal, type ExportCellType, type ExportSheet } from "./types";

const NUM_FMT: Record<ExportCellType, string> = {
  currency: '"$"#,##0.00',
  number: "#,##0",
  decimal: "#,##0.00",
  // Stored divided by 100 (see cellValue) so Excel's native percent works.
  percent: "0.0%",
};

/** Excel's value for a cell — percent stored as a fraction so `0.0%` works. */
function cellValue(value: number, type: ExportCellType): number {
  return type === "percent" ? value / 100 : value;
}

/** Excel worksheet names: ≤31 chars, no []:*?/\ , and unique per workbook. */
function safeSheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31) || "Sheet";
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${i++})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export async function sheetsToWorkbookBuffer(sheets: ExportSheet[]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ComeçaAI";
  workbook.created = new Date();

  const usedNames = new Set<string>();

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(safeSheetName(sheet.name, usedNames));
    const dataColCount = sheet.columnHeaders.length;
    const totalColIndex = dataColCount + 2; // 1 = Metric, then data, then Total

    // Header row.
    const headerCells = ["", ...sheet.columnHeaders, sheet.totalHeader];
    const headerRow = ws.addRow(headerCells);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "right" };
    headerRow.getCell(1).alignment = { horizontal: "left" };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
      cell.border = { bottom: { style: "thin", color: { argb: "FFD1D5DB" } } };
    });

    for (const section of sheet.sections) {
      // Section header row — label in col A, spanning the row visually.
      const sectionRow = ws.addRow([section.header]);
      sectionRow.font = { bold: true };
      sectionRow.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEFF1F4" },
      };

      for (const row of section.rows) {
        const indent = "  ".repeat(row.level ?? 0);
        const total = computeTotal(row.values, row.totalMode);
        const cells: (string | number)[] = [
          indent + row.label,
          ...row.values.map((v) => cellValue(v, row.type)),
          cellValue(total, row.type),
        ];
        const dataRow = ws.addRow(cells);
        if (row.bold) dataRow.font = { bold: true };
        // Apply number format to every numeric cell (data + total).
        for (let c = 2; c <= totalColIndex; c++) {
          dataRow.getCell(c).numFmt = NUM_FMT[row.type];
        }
      }
    }

    // Column widths: wide label column, fixed numeric columns, freeze header
    // + metric column so both stay visible while scrolling.
    ws.getColumn(1).width = 34;
    for (let c = 2; c <= totalColIndex; c++) ws.getColumn(c).width = 14;
    ws.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

/** Browser-only: turn the buffer into a download. No-op guard off the client. */
export function triggerDownload(buffer: ArrayBuffer, filename: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
