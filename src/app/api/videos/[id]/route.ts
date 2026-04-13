import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateKnowledgeVideoSchema } from "@/lib/validators/videos";
import { unlink } from "fs/promises";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const video = await prisma.knowledgeVideo.findUnique({ where: { id } });
  if (!video) return apiError("Not found", 404);
  return apiSuccess(video);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateKnowledgeVideoSchema);
  if ("error" in result) return result.error;

  const video = await prisma.knowledgeVideo.update({
    where: { id },
    data: result.data,
  });
  return apiSuccess(video);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const video = await prisma.knowledgeVideo.findUnique({ where: { id } });
  if (!video) return apiError("Not found", 404);

  await prisma.knowledgeVideo.delete({ where: { id } });

  // Delete video file from disk (best effort)
  try {
    const filePath = path.join(process.cwd(), "public", video.fileUrl);
    await unlink(filePath);
  } catch {
    // ignore
  }

  // Delete thumbnail if it exists
  if (video.thumbnailUrl) {
    try {
      const thumbPath = path.join(process.cwd(), "public", video.thumbnailUrl);
      await unlink(thumbPath);
    } catch {
      // ignore
    }
  }

  return apiSuccess({ deleted: true });
}
