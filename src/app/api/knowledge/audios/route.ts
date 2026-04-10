import { prisma } from "@/lib/prisma";
import { apiSuccess, parseAndValidate } from "@/lib/api-utils";
import { createKnowledgeAudioSchema } from "@/lib/validators/knowledge-audio";

export async function GET() {
  const audios = await prisma.knowledgeAudio.findMany({
    orderBy: { uploadedAt: "desc" },
  });

  const stats = {
    total: audios.length,
    pending: audios.filter((a) => a.status === "PENDING").length,
    processing: audios.filter((a) => a.status === "PROCESSING").length,
    ready: audios.filter((a) => a.status === "READY").length,
    error: audios.filter((a) => a.status === "ERROR").length,
    totalSize: audios.reduce((sum, a) => sum + a.fileSize, 0),
  };

  return apiSuccess({ audios, stats });
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createKnowledgeAudioSchema);
  if ("error" in result) return result.error;

  const audio = await prisma.knowledgeAudio.create({ data: result.data });
  return apiSuccess(audio, 201);
}
