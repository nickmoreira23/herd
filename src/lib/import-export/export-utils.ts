import ExcelJS from "exceljs";
import type { EntityConfig, ExportableColumn } from "./entity-config";

function formatCellValue(
  value: unknown,
  col: ExportableColumn
): string | number | boolean {
  if (value === null || value === undefined) return "";

  switch (col.type) {
    case "decimal":
      return Number(Number(value).toFixed(2));
    case "number":
      return Number(value);
    case "boolean":
      return value === true || value === "true" ? true : false;
    case "string[]":
      return Array.isArray(value) ? value.join("; ") : String(value);
    default:
      return String(value);
  }
}

export async function buildExportWorkbook(
  config: EntityConfig,
  selectedColumnKeys: string[],
  records: Record<string, unknown>[]
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HERD OS";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(config.displayName);

  // Build column list: identifier first (always), then selected columns
  const selectedCols = config.columns.filter((c) =>
    selectedColumnKeys.includes(c.key)
  );

  const identifierCol: ExportableColumn = {
    key: config.identifierField,
    label: config.identifierLabel,
    type: "string",
  };

  const allCols = [identifierCol, ...selectedCols];

  // Set up worksheet columns
  sheet.columns = allCols.map((col) => ({
    header: col.label,
    key: col.key,
    width: Math.max(col.label.length + 4, 15),
  }));

  // Add data rows
  for (const record of records) {
    const row: Record<string, string | number | boolean> = {};
    for (const col of allCols) {
      row[col.key] = formatCellValue(record[col.key], col);
    }
    sheet.addRow(row);
  }

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  headerRow.border = {
    bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  };

  // Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // Auto-fit column widths based on content
  sheet.columns.forEach((column) => {
    if (!column.values) return;
    let maxLength = 0;
    column.values.forEach((val) => {
      if (val) {
        const len = String(val).length;
        if (len > maxLength) maxLength = len;
      }
    });
    column.width = Math.min(Math.max(maxLength + 2, 12), 50);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  // writeBuffer returns ArrayBuffer-like, cast to satisfy Response constructor
  return buffer as ArrayBuffer;
}
