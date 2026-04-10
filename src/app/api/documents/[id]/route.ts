import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateDocumentSchema } from "@/lib/validators/document";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) return apiError("Not found", 404);
  return apiSuccess(document);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateDocumentSchema);
  if ("error" in result) return result.error;

  const document = await prisma.document.update({
    where: { id },
    data: result.data,
  });
  return apiSuccess(document);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.document.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
