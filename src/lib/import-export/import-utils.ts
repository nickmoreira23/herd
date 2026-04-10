import * as XLSX from "xlsx";
import type { EntityConfig, ExportableColumn } from "./entity-config";
import { prisma } from "@/lib/prisma";

export interface ParsedRow {
  identifier: string;
  data: Record<string, unknown>;
  rowNumber: number;
}

export interface ParseResult {
  rows: ParsedRow[];
  detectedColumns: string[];
  errors: string[];
}

export interface UpdateResult {
  updated: number;
  notFound: string[];
  errors: Array<{ identifier: string; error: string }>;
}

function parseValue(
  raw: unknown,
  col: ExportableColumn
): unknown {
  if (raw === null || raw === undefined || raw === "") return undefined;

  const str = String(raw).trim();
  if (str === "") return undefined;

  switch (col.type) {
    case "decimal":
    case "number": {
      const num = Number(str);
      return isNaN(num) ? undefined : num;
    }
    case "boolean":
      return str.toLowerCase() === "true" || str === "1";
    case "string[]":
      return str.split(";").map((s) => s.trim()).filter(Boolean);
    default:
      return str;
  }
}

export async function parseImportWorkbook(
  config: EntityConfig,
  buffer: ArrayBuffer | Uint8Array
): Promise<ParseResult> {
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], detectedColumns: [], errors: ["No worksheet found in file"] };
  }

  const sheet = workbook.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (raw.length === 0) {
    return { rows: [], detectedColumns: [], errors: ["No data found in file"] };
  }

  // Read header row (0-based index)
  const headerValues = (raw[0] || []).map((h) => String(h ?? "").trim());
  const headerMap = new Map<number, ExportableColumn>();
  let identifierColIndex = -1;

  // Build a lookup from lowercase label -> column config
  const labelLookup = new Map<string, ExportableColumn>();
  for (const col of config.columns) {
    labelLookup.set(col.label.toLowerCase(), col);
    labelLookup.set(col.key.toLowerCase(), col);
  }

  for (let i = 0; i < headerValues.length; i++) {
    const headerText = headerValues[i].toLowerCase();
    if (!headerText) continue;

    // Check if this is the identifier column
    if (
      headerText === config.identifierField.toLowerCase() ||
      headerText === config.identifierLabel.toLowerCase()
    ) {
      identifierColIndex = i;
      continue;
    }

    // Check if it matches a known column
    const matched = labelLookup.get(headerText);
    if (matched) {
      headerMap.set(i, matched);
    }
  }

  if (identifierColIndex === -1) {
    return {
      rows: [],
      detectedColumns: [],
      errors: [
        `Missing required column: "${config.identifierLabel}". The spreadsheet must include a ${config.identifierLabel} column to identify which records to update.`,
      ],
    };
  }

  const detectedColumns = Array.from(headerMap.values()).map((c) => c.label);
  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  for (let rowIdx = 1; rowIdx < raw.length; rowIdx++) {
    const rowData = raw[rowIdx];
    const rowNumber = rowIdx + 1; // 1-based for error messages

    const identifierValue = String(rowData[identifierColIndex] ?? "").trim();
    if (!identifierValue) {
      errors.push(`Row ${rowNumber}: missing ${config.identifierLabel}`);
      continue;
    }

    const data: Record<string, unknown> = {};
    headerMap.forEach((col, colIndex) => {
      const cellValue = rowData[colIndex];
      const parsed = parseValue(cellValue, col);
      if (parsed !== undefined) {
        data[col.key] = parsed;
      }
    });

    if (Object.keys(data).length === 0) {
      continue; // skip rows with no updateable data
    }

    rows.push({ identifier: identifierValue, data, rowNumber });
  }

  return { rows, detectedColumns, errors };
}

export async function executePartialUpdates(
  config: EntityConfig,
  rows: ParsedRow[]
): Promise<UpdateResult> {
  const identifiers = rows.map((r) => r.identifier);

  // Fetch existing records by identifier
  const existingRecords = await (prisma as Record<string, any>)[
    config.prismaModel
  ].findMany({
    where: { [config.identifierField]: { in: identifiers } },
    select: { id: true, [config.identifierField]: true },
  });

  const existingMap = new Map<string, string>();
  for (const rec of existingRecords) {
    existingMap.set(rec[config.identifierField], rec.id);
  }

  const notFound: string[] = [];
  const updateErrors: Array<{ identifier: string; error: string }> = [];
  let updated = 0;

  // Build update operations
  const operations: Array<Promise<unknown>> = [];

  for (const row of rows) {
    const recordId = existingMap.get(row.identifier);
    if (!recordId) {
      notFound.push(row.identifier);
      continue;
    }

    operations.push(
      (prisma as Record<string, any>)[config.prismaModel]
        .update({
          where: { id: recordId },
          data: row.data,
        })
        .then(() => {
          updated++;
        })
        .catch((err: Error) => {
          updateErrors.push({
            identifier: row.identifier,
            error: err.message,
          });
        })
    );
  }

  // Execute all updates (batched via Promise.all for speed)
  await Promise.all(operations);

  return { updated, notFound, errors: updateErrors };
}
