import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createFormSectionSchema } from "@/lib/validations/knowledge-form";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sections = await prisma.knowledgeFormSection.findMany({
    where: { formId: id },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
  return apiSuccess(sections);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await prisma.knowledgeForm.findUnique({ where: { id } });
  if (!form) return apiError("Form not found", 404);

  const result = await parseAndValidate(request, createFormSectionSchema);
  if ("error" in result) return result.error;

  const section = await prisma.knowledgeFormSection.create({
    data: {
      formId: id,
      title: result.data.title || null,
      description: result.data.description || null,
      sortOrder: result.data.sortOrder ?? 0,
    },
    include: { fields: true },
  });

  return apiSuccess(section, 201);
}
