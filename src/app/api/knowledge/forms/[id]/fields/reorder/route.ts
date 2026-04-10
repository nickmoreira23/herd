import { prisma } from "@/lib/prisma";
import { apiSuccess, parseAndValidate } from "@/lib/api-utils";
import { reorderFormFieldsSchema } from "@/lib/validations/knowledge-form";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: _id } = await params;
  const result = await parseAndValidate(request, reorderFormFieldsSchema);
  if ("error" in result) return result.error;

  const updates = result.data.fieldIds.map((fieldId, index) =>
    prisma.knowledgeFormField.update({
      where: { id: fieldId },
      data: { sortOrder: index },
    })
  );

  await prisma.$transaction(updates);

  return apiSuccess({ reordered: true });
}
