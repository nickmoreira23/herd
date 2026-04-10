import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateFormSectionSchema } from "@/lib/validations/knowledge-form";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const { id, sectionId } = await params;
  const section = await prisma.knowledgeFormSection.findFirst({
    where: { id: sectionId, formId: id },
  });
  if (!section) return apiError("Section not found", 404);

  const result = await parseAndValidate(request, updateFormSectionSchema);
  if ("error" in result) return result.error;

  const updated = await prisma.knowledgeFormSection.update({
    where: { id: sectionId },
    data: result.data,
  });
  return apiSuccess(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const { id, sectionId } = await params;
  const section = await prisma.knowledgeFormSection.findFirst({
    where: { id: sectionId, formId: id },
  });
  if (!section) return apiError("Section not found", 404);
  await prisma.knowledgeFormSection.delete({ where: { id: sectionId } });
  return apiSuccess({ deleted: true });
}
