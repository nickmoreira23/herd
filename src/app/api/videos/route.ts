import { prisma } from "@/lib/prisma";
import { apiSuccess, parseAndValidate } from "@/lib/api-utils";
import { createKnowledgeVideoSchema } from "@/lib/validators/videos";

export async function GET() {
  const videos = await prisma.knowledgeVideo.findMany({
    orderBy: { uploadedAt: "desc" },
  });

  const stats = {
    total: videos.length,
    pending: videos.filter((v) => v.status === "PENDING").length,
    processing: videos.filter((v) => v.status === "PROCESSING").length,
    ready: videos.filter((v) => v.status === "READY").length,
    error: videos.filter((v) => v.status === "ERROR").length,
    totalSize: videos.reduce((sum, v) => sum + v.fileSize, 0),
  };

  return apiSuccess({ videos, stats });
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createKnowledgeVideoSchema);
  if ("error" in result) return result.error;

  const video = await prisma.knowledgeVideo.create({ data: result.data });
  return apiSuccess(video, 201);
}
