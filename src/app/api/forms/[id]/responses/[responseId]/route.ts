import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  const { id, responseId } = await params;
  const response = await prisma.knowledgeFormResponse.findFirst({
    where: { id: responseId, formId: id },
  });
  if (!response) return apiError("Response not found", 404);
  return apiSuccess(response);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  const { id, responseId } = await params;
  const response = await prisma.knowledgeFormResponse.findFirst({
    where: { id: responseId, formId: id },
  });
  if (!response) return apiError("Response not found", 404);

  await prisma.knowledgeFormResponse.delete({ where: { id: responseId } });

  // Decrement response count
  await prisma.knowledgeForm.update({
    where: { id },
    data: { responseCount: { decrement: 1 } },
  });

  return apiSuccess({ deleted: true });
}
