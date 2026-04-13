import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateKnowledgeDocumentSchema } from "@/lib/validators/documents";
import { unlink } from "fs/promises";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const document = await prisma.knowledgeDocument.findUnique({ where: { id } });
  if (!document) return apiError("Not found", 404);
  return apiSuccess(document);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateKnowledgeDocumentSchema);
  if ("error" in result) return result.error;

  const document = await prisma.knowledgeDocument.update({
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

  // Fetch doc to get file path before deleting
  const doc = await prisma.knowledgeDocument.findUnique({ where: { id } });
  if (!doc) return apiError("Not found", 404);

  // Delete DB record
  await prisma.knowledgeDocument.delete({ where: { id } });

  // Delete file from disk (best effort)
  try {
    const filePath = path.join(process.cwd(), "public", doc.fileUrl);
    await unlink(filePath);
  } catch {
    // File may already be removed -- ignore
  }

  return apiSuccess({ deleted: true });
}
