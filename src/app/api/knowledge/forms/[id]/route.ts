import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateKnowledgeFormSchema } from "@/lib/validations/knowledge-form";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await prisma.knowledgeForm.findUnique({
    where: { id },
    include: {
      sections: {
        include: { fields: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!form) return apiError("Not found", 404);
  return apiSuccess(form);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateKnowledgeFormSchema);
  if ("error" in result) return result.error;

  const form = await prisma.knowledgeForm.update({
    where: { id },
    data: {
      ...result.data,
      startsAt: result.data.startsAt ? new Date(result.data.startsAt) : undefined,
      endsAt: result.data.endsAt ? new Date(result.data.endsAt) : undefined,
    },
  });
  return apiSuccess(form);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await prisma.knowledgeForm.findUnique({ where: { id } });
  if (!form) return apiError("Not found", 404);
  await prisma.knowledgeForm.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
