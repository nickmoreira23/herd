import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface FieldDef {
  id: string;
  type: string;
  options: Record<string, unknown> | null;
  isRequired: boolean;
  isPrimary: boolean;
}

/**
 * Validates record data against field definitions.
 * Returns an error message if invalid, or null if valid.
 */
export function validateRecordData(
  data: Record<string, unknown>,
  fields: FieldDef[]
): string | null {
  const fieldMap = new Map(fields.map((f) => [f.id, f]));

  // Check required fields have values
  for (const field of fields) {
    if (field.isRequired && !field.isPrimary) {
      const value = data[field.id];
      if (value === undefined || value === null || value === "") {
        return `Field "${field.id}" is required`;
      }
    }
  }

  // Validate data keys match existing fields
  for (const key of Object.keys(data)) {
    if (!fieldMap.has(key)) {
      // Silently skip unknown keys rather than failing
      continue;
    }
  }

  // Basic type validation
  for (const [fieldId, value] of Object.entries(data)) {
    const field = fieldMap.get(fieldId);
    if (!field || value === null || value === undefined) continue;

    switch (field.type) {
      case "number":
      case "currency":
      case "percent":
        if (typeof value !== "number" && typeof value !== "string") {
          return `Field "${fieldId}" must be a number`;
        }
        break;
      case "checkbox":
        if (typeof value !== "boolean") {
          return `Field "${fieldId}" must be a boolean`;
        }
        break;
      case "singleSelect": {
        if (typeof value !== "string") {
          return `Field "${fieldId}" must be a string`;
        }
        break;
      }
      case "multiSelect": {
        if (!Array.isArray(value)) {
          return `Field "${fieldId}" must be an array`;
        }
        break;
      }
      case "linkedRecord": {
        if (!Array.isArray(value)) {
          return `Field "${fieldId}" must be an array of record IDs`;
        }
        break;
      }
    }
  }

  return null;
}

/**
 * Synchronizes bidirectional linked records.
 * When a record links to others via a linkedRecord field,
 * the inverse field on those records must also be updated.
 */
export async function syncLinkedRecords(
  recordId: string,
  tableId: string,
  fieldId: string,
  newLinkedIds: string[],
  previousLinkedIds: string[]
) {
  const field = await prisma.knowledgeTableField.findUnique({
    where: { id: fieldId },
  });
  if (!field || field.type !== "linkedRecord") return;

  const options = field.options as Record<string, unknown> | null;
  const inverseLinkFieldId = options?.inverseLinkFieldId as string | undefined;
  if (!inverseLinkFieldId) return;

  const added = newLinkedIds.filter((id) => !previousLinkedIds.includes(id));
  const removed = previousLinkedIds.filter((id) => !newLinkedIds.includes(id));

  // Add inverse references
  for (const linkedRecordId of added) {
    const linkedRecord = await prisma.knowledgeTableRecord.findUnique({
      where: { id: linkedRecordId },
    });
    if (!linkedRecord) continue;

    const linkedData = (linkedRecord.data as Record<string, unknown>) || {};
    const inverseIds = Array.isArray(linkedData[inverseLinkFieldId])
      ? [...(linkedData[inverseLinkFieldId] as string[])]
      : [];

    if (!inverseIds.includes(recordId)) {
      inverseIds.push(recordId);
      await prisma.knowledgeTableRecord.update({
        where: { id: linkedRecordId },
        data: {
          data: { ...linkedData, [inverseLinkFieldId]: inverseIds } as unknown as Prisma.InputJsonValue,
        },
      });
    }
  }

  // Remove inverse references
  for (const linkedRecordId of removed) {
    const linkedRecord = await prisma.knowledgeTableRecord.findUnique({
      where: { id: linkedRecordId },
    });
    if (!linkedRecord) continue;

    const linkedData = (linkedRecord.data as Record<string, unknown>) || {};
    const inverseIds = Array.isArray(linkedData[inverseLinkFieldId])
      ? (linkedData[inverseLinkFieldId] as string[]).filter(
          (id) => id !== recordId
        )
      : [];

    await prisma.knowledgeTableRecord.update({
      where: { id: linkedRecordId },
      data: {
        data: { ...linkedData, [inverseLinkFieldId]: inverseIds } as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
