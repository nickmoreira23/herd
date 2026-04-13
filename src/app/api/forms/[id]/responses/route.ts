import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await prisma.knowledgeForm.findUnique({ where: { id } });
  if (!form) return apiError("Form not found", 404);

  const responses = await prisma.knowledgeFormResponse.findMany({
    where: { formId: id },
    orderBy: { submittedAt: "desc" },
  });

  return apiSuccess({ responses, total: responses.length });
}
