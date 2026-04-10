import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const BASE_URL = "https://api.airtable.com/v0";

// ─── Airtable API Types ────────────────────────────────────────────

export interface AirtableBase {
  id: string;
  name: string;
  permissionLevel: string;
}

export interface AirtableFieldSchema {
  id: string;
  name: string;
  type: string;
  description?: string;
  options?: Record<string, unknown>;
}

export interface AirtableTableSchema {
  id: string;
  name: string;
  description?: string;
  fields: AirtableFieldSchema[];
  primaryFieldId: string;
}

export interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
}

export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  thumbnails?: Record<string, { url: string; width: number; height: number }>;
}

// ─── Field Type Mapping ────────────────────────────────────────────

const AIRTABLE_TO_HERD_TYPE: Record<string, string> = {
  singleLineText: "singleLineText",
  multilineText: "multilineText",
  richText: "multilineText",
  email: "email",
  url: "url",
  number: "number",
  percent: "percent",
  currency: "currency",
  singleSelect: "singleSelect",
  multipleSelects: "multiSelect",
  checkbox: "checkbox",
  date: "date",
  dateTime: "date",
  multipleAttachments: "media",
  phoneNumber: "singleLineText",
  rating: "number",
  duration: "singleLineText",
  barcode: "singleLineText",
  singleCollaborator: "singleLineText",
  multipleCollaborators: "singleLineText",
  multipleRecordLinks: "singleLineText",
  formula: "formula",
  rollup: "rollup",
  lookup: "lookup",
  count: "count",
  createdTime: "createdTime",
  lastModifiedTime: "lastModifiedTime",
  autoNumber: "autoNumber",
  createdBy: "singleLineText",
  lastModifiedBy: "singleLineText",
  button: "singleLineText",
  externalSyncSource: "singleLineText",
  aiText: "multilineText",
};

/**
 * Maps an Airtable field definition to HERD Knowledge Table field type + options.
 */
export function mapAirtableFieldToHerd(field: AirtableFieldSchema): {
  type: string;
  options?: Record<string, unknown>;
} {
  const herdType = AIRTABLE_TO_HERD_TYPE[field.type] || "singleLineText";
  let options: Record<string, unknown> | undefined;

  switch (field.type) {
    case "number": {
      const precision = (field.options?.precision as number) ?? 0;
      options = { precision };
      break;
    }
    case "currency": {
      const symbol = (field.options?.symbol as string) ?? "$";
      const precision = (field.options?.precision as number) ?? 2;
      options = { symbol, precision };
      break;
    }
    case "percent": {
      const precision = (field.options?.precision as number) ?? 1;
      options = { precision };
      break;
    }
    case "rating": {
      const max = (field.options?.max as number) ?? 5;
      options = { precision: 0, max };
      break;
    }
    case "singleSelect": {
      const choices = (
        field.options?.choices as { id: string; name: string; color?: string }[]
      )?.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color || "zinc",
      }));
      options = choices ? { choices } : undefined;
      break;
    }
    case "multipleSelects": {
      const choices = (
        field.options?.choices as { id: string; name: string; color?: string }[]
      )?.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color || "zinc",
      }));
      options = choices ? { choices } : undefined;
      break;
    }
  }

  return { type: herdType, options };
}

/**
 * Transform an Airtable record value for a given field type into HERD format.
 */
export function transformAirtableValue(
  value: unknown,
  airtableType: string
): unknown {
  if (value == null) return null;

  switch (airtableType) {
    case "singleCollaborator": {
      const collab = value as { name?: string; email?: string };
      return collab.name || collab.email || String(value);
    }
    case "multipleCollaborators": {
      const collabs = value as { name?: string; email?: string }[];
      return collabs.map((c) => c.name || c.email).join(", ");
    }
    case "multipleRecordLinks": {
      const ids = value as string[];
      return ids.join(", ");
    }
    case "barcode": {
      const bc = value as { text?: string };
      return bc.text || String(value);
    }
    case "button": {
      const btn = value as { label?: string; url?: string };
      return btn.url || btn.label || "";
    }
    case "duration": {
      const secs = value as number;
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
    }
    case "rating": {
      return Number(value);
    }
    // multipleAttachments handled separately in import logic
    default:
      return value;
  }
}

// ─── Attachment Download ───────────────────────────────────────────

/**
 * Download an Airtable attachment to local storage.
 * Airtable attachment URLs expire after ~2 hours, so download promptly.
 */
export async function downloadAirtableAttachment(
  attachment: AirtableAttachment,
  tableId: string
): Promise<{
  url: string;
  filename: string;
  size: number;
  type: string;
  mediaType: string;
}> {
  const res = await fetch(attachment.url);
  if (!res.ok) {
    throw new Error(
      `Failed to download attachment ${attachment.filename}: ${res.status}`
    );
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = attachment.filename.split(".").pop() || "bin";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const localFilename = `${timestamp}-${random}.${ext}`;

  const uploadDir = join(
    process.cwd(),
    "public",
    "uploads",
    "knowledge",
    "tables"
  );
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, localFilename), buffer);

  const mimeType = attachment.type || "";
  let mediaType = "file";
  if (mimeType.startsWith("image/")) mediaType = "image";
  else if (mimeType.startsWith("video/")) mediaType = "video";

  return {
    url: `/uploads/knowledge/tables/${localFilename}`,
    filename: attachment.filename,
    size: attachment.size || buffer.length,
    type: attachment.type,
    mediaType,
  };
}

/**
 * Run async tasks with a concurrency limit.
 */
export async function withConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, tasks.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

// ─── Service Class ─────────────────────────────────────────────────

export class AirtableService {
  private token: string;
  private requestTimestamps: number[] = [];

  constructor(personalAccessToken: string) {
    this.token = personalAccessToken;
  }

  /**
   * Rate-limited request to Airtable API.
   * Enforces max 5 requests per second.
   */
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    // Rate limiting: max 5 requests per second
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      (t) => now - t < 1000
    );
    if (this.requestTimestamps.length >= 5) {
      const oldest = this.requestTimestamps[0];
      const waitMs = 1000 - (now - oldest);
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
    this.requestTimestamps.push(Date.now());

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<{ baseCount: number }> {
    const data = await this.request<{ bases: AirtableBase[] }>("/meta/bases");
    return { baseCount: data.bases.length };
  }

  // ── Bases ──

  async listBases(): Promise<AirtableBase[]> {
    const data = await this.request<{
      bases: AirtableBase[];
      offset?: string;
    }>("/meta/bases");
    // Airtable paginates bases too; collect all
    const bases = [...data.bases];
    let offset = data.offset;
    while (offset) {
      const next = await this.request<{
        bases: AirtableBase[];
        offset?: string;
      }>(`/meta/bases?offset=${offset}`);
      bases.push(...next.bases);
      offset = next.offset;
    }
    return bases;
  }

  // ── Tables / Schema ──

  async getBaseSchema(baseId: string): Promise<AirtableTableSchema[]> {
    const data = await this.request<{ tables: AirtableTableSchema[] }>(
      `/meta/bases/${baseId}/tables`
    );
    return data.tables;
  }

  // ── Records ──

  async listRecords(
    baseId: string,
    tableId: string,
    offset?: string
  ): Promise<{ records: AirtableRecord[]; offset?: string }> {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    return this.request<{ records: AirtableRecord[]; offset?: string }>(
      `/${baseId}/${tableId}?${params.toString()}`
    );
  }

  /**
   * Async generator that yields pages of records.
   * Each yield is an array of up to 100 records.
   */
  async *getAllRecords(
    baseId: string,
    tableId: string
  ): AsyncGenerator<AirtableRecord[]> {
    let offset: string | undefined;
    do {
      const page = await this.listRecords(baseId, tableId, offset);
      yield page.records;
      offset = page.offset;
    } while (offset);
  }
}
