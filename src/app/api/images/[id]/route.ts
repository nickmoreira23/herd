import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateKnowledgeImageSchema } from "@/lib/validators/images";
import { unlink } from "fs/promises";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const image = await prisma.knowledgeImage.findUnique({ where: { id } });
  if (!image) return apiError("Not found", 404);
  return apiSuccess(image);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateKnowledgeImageSchema);
  if ("error" in result) return result.error;

  const image = await prisma.knowledgeImage.update({
    where: { id },
    data: result.data,
  });
  return apiSuccess(image);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const image = await prisma.knowledgeImage.findUnique({ where: { id } });
  if (!image) return apiError("Not found", 404);

  await prisma.knowledgeImage.delete({ where: { id } });

  // Delete file from disk (best effort)
  try {
    const filePath = path.join(process.cwd(), "public", image.fileUrl);
    await unlink(filePath);
  } catch {
    // File may already be removed — ignore
  }

  return apiSuccess({ deleted: true });
}
