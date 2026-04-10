import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateKnowledgeAudioSchema } from "@/lib/validators/knowledge-audio";
import { unlink } from "fs/promises";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const audio = await prisma.knowledgeAudio.findUnique({ where: { id } });
  if (!audio) return apiError("Not found", 404);
  return apiSuccess(audio);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateKnowledgeAudioSchema);
  if ("error" in result) return result.error;

  const audio = await prisma.knowledgeAudio.update({
    where: { id },
    data: result.data,
  });
  return apiSuccess(audio);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const audio = await prisma.knowledgeAudio.findUnique({ where: { id } });
  if (!audio) return apiError("Not found", 404);

  await prisma.knowledgeAudio.delete({ where: { id } });

  // Delete audio file from disk (best effort)
  try {
    const filePath = path.join(process.cwd(), "public", audio.fileUrl);
    await unlink(filePath);
  } catch {
    // ignore
  }

  return apiSuccess({ deleted: true });
}
