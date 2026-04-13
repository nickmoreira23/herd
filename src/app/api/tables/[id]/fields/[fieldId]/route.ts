import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateKnowledgeTableFieldSchema } from "@/lib/validators/tables";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const { id: tableId, fieldId } = await params;
  const result = await parseAndValidate(request, updateKnowledgeTableFieldSchema);
  if ("error" in result) return result.error;

  const field = await prisma.knowledgeTableField.findFirst({
    where: { id: fieldId, tableId },
  });
  if (!field) return apiError("Field not found", 404);

  const { options, ...rest } = result.data;
  const updated = await prisma.knowledgeTableField.update({
    where: { id: fieldId },
    data: {
      ...rest,
      ...(options !== undefined && { options: options as Prisma.InputJsonValue }),
    },
  });

  return apiSuccess(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const { id: tableId, fieldId } = await params;

  const field = await prisma.knowledgeTableField.findFirst({
    where: { id: fieldId, tableId },
  });
  if (!field) return apiError("Field not found", 404);

  if (field.isPrimary) {
    return apiError("Cannot delete the primary field", 400);
  }

  // If linkedRecord, also delete the inverse field
  if (field.type === "linkedRecord" && field.options) {
    const options = field.options as Record<string, unknown>;
    const inverseLinkFieldId = options.inverseLinkFieldId as string | undefined;
    const linkedTableId = options.linkedTableId as string | undefined;

    if (inverseLinkFieldId) {
      await prisma.knowledgeTableField.deleteMany({
        where: { id: inverseLinkFieldId },
      });

      if (linkedTableId) {
        await prisma.knowledgeTable.update({
          where: { id: linkedTableId },
          data: { fieldCount: { decrement: 1 } },
        });
      }
    }
  }

  // Remove field data from all records using raw SQL for efficiency
  await prisma.$executeRawUnsafe(
    `UPDATE "KnowledgeTableRecord" SET data = data - $1 WHERE "tableId" = $2::uuid`,
    fieldId,
    tableId
  );

  await prisma.knowledgeTableField.delete({ where: { id: fieldId } });

  await prisma.knowledgeTable.update({
    where: { id: tableId },
    data: { fieldCount: { decrement: 1 } },
  });

  return apiSuccess({ deleted: true });
}
