import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateFormFieldSchema } from "@/lib/validations/knowledge-form";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const { id, fieldId } = await params;

  // Verify field belongs to this form via its section
  const field = await prisma.knowledgeFormField.findUnique({
    where: { id: fieldId },
    include: { section: true },
  });
  if (!field || field.section.formId !== id) {
    return apiError("Field not found", 404);
  }

  const result = await parseAndValidate(request, updateFormFieldSchema);
  if ("error" in result) return result.error;

  // If moving to a different section, verify it belongs to this form
  if (result.data.sectionId) {
    const section = await prisma.knowledgeFormSection.findFirst({
      where: { id: result.data.sectionId, formId: id },
    });
    if (!section) return apiError("Target section not found in this form", 404);
  }

  const data: Record<string, unknown> = { ...result.data };
  if (data.options !== undefined) {
    data.options = data.options ? (data.options as Prisma.InputJsonValue) : Prisma.JsonNull;
  }
  if (data.validation !== undefined) {
    data.validation = data.validation ? (data.validation as Prisma.InputJsonValue) : Prisma.JsonNull;
  }
  if (data.conditionalLogic !== undefined) {
    data.conditionalLogic = data.conditionalLogic ? (data.conditionalLogic as Prisma.InputJsonValue) : Prisma.JsonNull;
  }

  const updated = await prisma.knowledgeFormField.update({
    where: { id: fieldId },
    data,
  });

  return apiSuccess(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const { id, fieldId } = await params;

  const field = await prisma.knowledgeFormField.findUnique({
    where: { id: fieldId },
    include: { section: true },
  });
  if (!field || field.section.formId !== id) {
    return apiError("Field not found", 404);
  }

  await prisma.knowledgeFormField.delete({ where: { id: fieldId } });
  return apiSuccess({ deleted: true });
}
