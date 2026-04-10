import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateKnowledgeTableRecordSchema } from "@/lib/validators/knowledge-table";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const { id: tableId, recordId } = await params;
  const record = await prisma.knowledgeTableRecord.findFirst({
    where: { id: recordId, tableId },
  });
  if (!record) return apiError("Record not found", 404);
  return apiSuccess(record);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const { id: tableId, recordId } = await params;
  const result = await parseAndValidate(request, updateKnowledgeTableRecordSchema);
  if ("error" in result) return result.error;

  const existing = await prisma.knowledgeTableRecord.findFirst({
    where: { id: recordId, tableId },
  });
  if (!existing) return apiError("Record not found", 404);

  // Merge new data into existing data
  const existingData = (existing.data as Record<string, unknown>) || {};
  const mergedData = { ...existingData, ...result.data.data };

  const record = await prisma.knowledgeTableRecord.update({
    where: { id: recordId },
    data: {
      data: mergedData as Prisma.InputJsonValue,
    },
  });

  // Mark table as needing re-processing
  await prisma.knowledgeTable.update({
    where: { id: tableId },
    data: { status: "PENDING" },
  });

  return apiSuccess(record);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const { id: tableId, recordId } = await params;

  const record = await prisma.knowledgeTableRecord.findFirst({
    where: { id: recordId, tableId },
  });
  if (!record) return apiError("Record not found", 404);

  await prisma.knowledgeTableRecord.delete({ where: { id: recordId } });

  await prisma.knowledgeTable.update({
    where: { id: tableId },
    data: {
      recordCount: { decrement: 1 },
      status: "PENDING",
    },
  });

  return apiSuccess({ deleted: true });
}
