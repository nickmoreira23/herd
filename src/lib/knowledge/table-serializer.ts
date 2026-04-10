/**
 * Serializes knowledge table records into structured text for RAG indexing.
 *
 * The output format is designed to be:
 * - Human-readable (useful for LLM consumption)
 * - Structured enough to preserve field/value relationships
 * - Compact to minimize token usage when chunked
 */

interface SerializableField {
  id: string;
  name: string;
  type: string;
  options?: Record<string, unknown> | null;
  isPrimary: boolean;
}

interface SerializableRecord {
  id: string;
  data: Record<string, unknown>;
}

/**
 * Serialize the table context header (name, description, field definitions).
 * This is prepended to each chunk so the LLM always knows the table schema.
 */
export function serializeTableContext(
  table: { name: string; description?: string | null },
  fields: SerializableField[]
): string {
  const lines: string[] = [];
  lines.push(`Table: ${table.name}`);
  if (table.description) {
    lines.push(`Description: ${table.description}`);
  }
  const fieldDefs = fields
    .map((f) => `${f.name} (${formatFieldType(f.type)})`)
    .join(", ");
  lines.push(`Fields: ${fieldDefs}`);
  return lines.join("\n");
}

/**
 * Serialize a single record into a readable text line.
 * Format: "PrimaryField: value. Field2: value2. Field3: value3."
 */
export function serializeRecord(
  record: SerializableRecord,
  fields: SerializableField[]
): string {
  const parts: string[] = [];

  for (const field of fields) {
    const raw = record.data[field.id];
    const formatted = formatValue(raw, field);
    if (formatted) {
      parts.push(`${field.name}: ${formatted}`);
    }
  }

  return parts.join(". ") + (parts.length > 0 ? "." : "");
}

/**
 * Serialize all records into text chunks for indexing.
 * Groups serialized records into chunks of approximately `targetChars` characters,
 * each prepended with the table context header.
 */
export function serializeTableToText(
  table: { name: string; description?: string | null },
  fields: SerializableField[],
  records: SerializableRecord[]
): string {
  if (records.length === 0) {
    return serializeTableContext(table, fields) + "\n\nNo records.";
  }

  const context = serializeTableContext(table, fields);
  const serializedRecords = records.map((r) => serializeRecord(r, fields));

  const lines: string[] = [context, ""];
  for (let i = 0; i < serializedRecords.length; i++) {
    const text = serializedRecords[i];
    if (text) {
      lines.push(`Record ${i + 1}: ${text}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format a field type name for display.
 */
function formatFieldType(type: string): string {
  const typeMap: Record<string, string> = {
    singleLineText: "text",
    multilineText: "long text",
    number: "number",
    singleSelect: "select",
    multiSelect: "multi-select",
    checkbox: "yes/no",
    date: "date",
    url: "URL",
    email: "email",
    currency: "currency",
    percent: "percent",
    linkedRecord: "linked record",
    media: "media",
    attachment: "attachment",
    formula: "formula",
    rollup: "rollup",
    lookup: "lookup",
    count: "count",
    createdTime: "created time",
    lastModifiedTime: "modified time",
    autoNumber: "auto number",
  };
  return typeMap[type] || type;
}

/**
 * Format a cell value to readable text based on field type.
 */
function formatValue(
  raw: unknown,
  field: SerializableField
): string | null {
  if (raw == null || raw === "") return null;

  switch (field.type) {
    case "checkbox":
      return raw ? "Yes" : "No";

    case "singleSelect": {
      const choices =
        (field.options?.choices as { id: string; name: string }[]) ?? [];
      const match = choices.find((c) => c.id === raw || c.name === raw);
      return match?.name ?? String(raw);
    }

    case "multiSelect": {
      const choices =
        (field.options?.choices as { id: string; name: string }[]) ?? [];
      const selected = Array.isArray(raw) ? (raw as string[]) : [String(raw)];
      return selected
        .map((v) => {
          const match = choices.find((c) => c.id === v || c.name === v);
          return match?.name ?? v;
        })
        .join(", ");
    }

    case "currency": {
      const symbol = (field.options?.symbol as string) ?? "$";
      const precision = (field.options?.precision as number) ?? 2;
      const num = Number(raw);
      return isNaN(num) ? String(raw) : `${symbol}${num.toFixed(precision)}`;
    }

    case "percent": {
      const precision = (field.options?.precision as number) ?? 1;
      const num = Number(raw);
      return isNaN(num) ? String(raw) : `${num.toFixed(precision)}%`;
    }

    case "date":
    case "createdTime":
    case "lastModifiedTime": {
      const d = new Date(String(raw));
      return isNaN(d.getTime()) ? String(raw) : d.toLocaleDateString();
    }

    case "media":
    case "attachment": {
      if (typeof raw === "object" && raw !== null && "filename" in raw) {
        const media = raw as { filename: string; mediaType?: string };
        return `[${media.mediaType || "file"}: ${media.filename}]`;
      }
      return null;
    }

    case "linkedRecord": {
      const ids = Array.isArray(raw) ? raw : [];
      if (ids.length === 0) return null;
      return `${ids.length} linked record${ids.length > 1 ? "s" : ""}`;
    }

    default:
      return String(raw);
  }
}
