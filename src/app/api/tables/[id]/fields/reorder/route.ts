import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { reorderFieldsSchema } from "@/lib/validators/tables";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tableId } = await params;
  const result = await parseAndValidate(request, reorderFieldsSchema);
  if ("error" in result) return result.error;

  const table = await prisma.knowledgeTable.findUnique({ where: { id: tableId } });
  if (!table) return apiError("Table not found", 404);

  const { fieldIds } = result.data;

  try {
    await prisma.$transaction(
      fieldIds.map((fieldId, index) =>
        prisma.knowledgeTableField.update({
          where: { id: fieldId },
          data: { sortOrder: index },
        })
      )
    );

    const fields = await prisma.knowledgeTableField.findMany({
      where: { tableId },
      orderBy: { sortOrder: "asc" },
    });

    return apiSuccess(fields);
  } catch (e) {
    console.error("Field reorder error:", e);
    return apiError("Failed to reorder fields", 500);
  }
}
