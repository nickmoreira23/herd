import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { z } from "zod";
import {
  AirtableService,
  downloadAirtableAttachment,
  transformAirtableValue,
  withConcurrencyLimit,
  type AirtableAttachment,
} from "@/lib/services/airtable";

const fieldMappingSchema = z.object({
  airtableFieldId: z.string(),
  airtableFieldName: z.string(),
  airtableFieldType: z.string(),
  herdFieldType: z.string(),
  herdFieldName: z.string(),
  options: z.record(z.unknown()).optional(),
  skip: z.boolean().optional(),
});

const importSchema = z.object({
  baseId: z.string().min(1),
  tableId: z.string().min(1),
  tableName: z.string().min(1).max(255),
  fieldMappings: z.array(fieldMappingSchema).min(1),
});

export async function POST(request: Request) {
  try {
    // Validate request
    const body = await request.json();
    const parsed = importSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.issues);
    }

    const { baseId, tableId, tableName, fieldMappings } = parsed.data;

    // Get Airtable credentials
    const integration = await prisma.integration.findUnique({
      where: { slug: "airtable" },
    });
    if (!integration?.credentials) {
      return apiError("Airtable not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials)) as {
      apiToken: string;
    };

    // Check for duplicate import
    const sourceId = `${baseId}/${tableId}`;
    const existing = await prisma.knowledgeTable.findFirst({
      where: { sourceId },
    });
    if (existing) {
      return apiError(
        `This table has already been imported as "${existing.name}" (ID: ${existing.id})`,
        409
      );
    }

    // Filter non-skipped fields
    const activeFields = fieldMappings.filter((f) => !f.skip);
    if (activeFields.length === 0) {
      return apiError("At least one field must be selected", 400);
    }

    // Create the KnowledgeTable
    const table = await prisma.knowledgeTable.create({
      data: {
        name: tableName,
        description: `Imported from Airtable`,
        status: "PROCESSING",
        sourceType: "airtable",
        sourceId,
        fieldCount: activeFields.length,
      },
    });

    // Create fields and build mapping
    const fieldIdMapping: Record<string, string> = {}; // airtableFieldName → herdFieldId
    const fieldTypeMapping: Record<string, string> = {}; // airtableFieldName → airtableFieldType
    let primarySet = false;

    for (let i = 0; i < activeFields.length; i++) {
      const fm = activeFields[i];
      const isPrimary =
        !primarySet && fm.herdFieldType === "singleLineText";
      if (isPrimary) primarySet = true;

      const field = await prisma.knowledgeTableField.create({
        data: {
          tableId: table.id,
          name: fm.herdFieldName,
          type: fm.herdFieldType,
          description: null,
          options: (fm.options ?? undefined) as Prisma.InputJsonValue | undefined,
          isPrimary: isPrimary || (i === 0 && !primarySet),
          isRequired: false,
          sortOrder: i,
        },
      });

      fieldIdMapping[fm.airtableFieldName] = field.id;
      fieldTypeMapping[fm.airtableFieldName] = fm.airtableFieldType;
    }

    // If no primary was set, mark the first field
    if (!primarySet && activeFields.length > 0) {
      const firstFieldName = activeFields[0].airtableFieldName;
      const firstFieldId = fieldIdMapping[firstFieldName];
      if (firstFieldId) {
        await prisma.knowledgeTableField.update({
          where: { id: firstFieldId },
          data: { isPrimary: true },
        });
      }
    }

    // Fire-and-forget record import
    importRecords(
      creds.apiToken,
      baseId,
      tableId,
      table.id,
      fieldIdMapping,
      fieldTypeMapping,
      integration.id
    ).catch((err) => {
      console.error("Airtable import background error:", err);
    });

    return apiSuccess({ tableId: table.id, status: "PROCESSING" });
  } catch (e) {
    console.error("POST /api/integrations/airtable/import error:", e);
    return apiError("Failed to start import", 500);
  }
}

/**
 * Background async function that paginates through Airtable records,
 * transforms them, and inserts into KnowledgeTableRecords.
 */
async function importRecords(
  apiToken: string,
  baseId: string,
  airtableTableId: string,
  herdTableId: string,
  fieldIdMapping: Record<string, string>,
  fieldTypeMapping: Record<string, string>,
  integrationId: string
) {
  const svc = new AirtableService(apiToken);
  let totalImported = 0;
  let sortOrder = 0;

  try {
    for await (const page of svc.getAllRecords(baseId, airtableTableId)) {
      const records: { tableId: string; data: object; sortOrder: number }[] =
        [];

      for (const airtableRecord of page) {
        const data: Record<string, unknown> = {};

        for (const [fieldName, herdFieldId] of Object.entries(
          fieldIdMapping
        )) {
          const rawValue = airtableRecord.fields[fieldName];
          if (rawValue == null) continue;

          const airtableType = fieldTypeMapping[fieldName];

          // Handle attachments/media specially
          if (airtableType === "multipleAttachments") {
            const attachments = rawValue as AirtableAttachment[];
            if (attachments.length > 0) {
              try {
                // Download attachments with concurrency limit
                const downloadTasks = attachments.map(
                  (att) => () =>
                    downloadAirtableAttachment(att, herdTableId)
                );
                const downloaded = await withConcurrencyLimit(
                  downloadTasks,
                  5
                );
                // Store all attachments as an array (media cells support multiple files)
                const valid = downloaded.filter(Boolean);
                data[herdFieldId] = valid.length === 1 ? valid[0] : valid.length > 1 ? valid : null;
              } catch (err) {
                console.error(
                  `Failed to download attachment for field ${fieldName}:`,
                  err
                );
                data[herdFieldId] = null;
              }
            }
          } else {
            data[herdFieldId] = transformAirtableValue(
              rawValue,
              airtableType
            );
          }
        }

        records.push({
          tableId: herdTableId,
          data,
          sortOrder: sortOrder++,
        });
      }

      // Batch insert
      if (records.length > 0) {
        await prisma.knowledgeTableRecord.createMany({ data: records });
        totalImported += records.length;

        // Update record count on table
        await prisma.knowledgeTable.update({
          where: { id: herdTableId },
          data: { recordCount: totalImported },
        });
      }
    }

    // Mark complete
    await prisma.knowledgeTable.update({
      where: { id: herdTableId },
      data: {
        status: "PENDING",
        recordCount: totalImported,
        sourceImportedAt: new Date(),
      },
    });

    // Update integration sync info
    await prisma.integration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date() },
    });

    await prisma.integrationSyncLog.create({
      data: {
        integrationId,
        action: "import_table",
        status: "success",
        details: `Imported ${totalImported} records into table ${herdTableId}`,
        recordsProcessed: totalImported,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Airtable record import error:", message);

    await prisma.knowledgeTable.update({
      where: { id: herdTableId },
      data: {
        status: "ERROR",
        errorMessage: `Import failed: ${message}`,
      },
    });

    await prisma.integrationSyncLog.create({
      data: {
        integrationId,
        action: "import_table",
        status: "error",
        details: message,
        recordsProcessed: totalImported,
      },
    });
  }
}
