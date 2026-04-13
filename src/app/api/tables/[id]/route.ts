import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateKnowledgeTableSchema } from "@/lib/validators/tables";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const table = await prisma.knowledgeTable.findUnique({
    where: { id },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
  if (!table) return apiError("Not found", 404);
  return apiSuccess(table);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateKnowledgeTableSchema);
  if ("error" in result) return result.error;

  const table = await prisma.knowledgeTable.update({
    where: { id },
    data: result.data,
  });
  return apiSuccess(table);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const table = await prisma.knowledgeTable.findUnique({ where: { id } });
  if (!table) return apiError("Not found", 404);

  await prisma.knowledgeTable.delete({ where: { id } });

  return apiSuccess({ deleted: true });
}
