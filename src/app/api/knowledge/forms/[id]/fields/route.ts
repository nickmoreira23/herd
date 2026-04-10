import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createFormFieldSchema } from "@/lib/validations/knowledge-form";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, createFormFieldSchema);
  if ("error" in result) return result.error;

  // Verify section belongs to this form
  const section = await prisma.knowledgeFormSection.findFirst({
    where: { id: result.data.sectionId, formId: id },
  });
  if (!section) return apiError("Section not found in this form", 404);

  const field = await prisma.knowledgeFormField.create({
    data: {
      sectionId: result.data.sectionId,
      label: result.data.label,
      type: result.data.type,
      placeholder: result.data.placeholder || null,
      helpText: result.data.helpText || null,
      isRequired: result.data.isRequired ?? false,
      options: (result.data.options as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      validation: (result.data.validation as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      conditionalLogic: (result.data.conditionalLogic as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      sortOrder: result.data.sortOrder ?? 0,
    },
  });

  return apiSuccess(field, 201);
}
