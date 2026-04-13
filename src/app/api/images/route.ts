import { prisma } from "@/lib/prisma";
import { apiSuccess, parseAndValidate } from "@/lib/api-utils";
import { createKnowledgeImageSchema } from "@/lib/validators/images";

export async function GET() {
  const images = await prisma.knowledgeImage.findMany({
    orderBy: { uploadedAt: "desc" },
  });

  const stats = {
    total: images.length,
    pending: images.filter((i) => i.status === "PENDING").length,
    processing: images.filter((i) => i.status === "PROCESSING").length,
    ready: images.filter((i) => i.status === "READY").length,
    error: images.filter((i) => i.status === "ERROR").length,
    totalSize: images.reduce((sum, i) => sum + i.fileSize, 0),
  };

  return apiSuccess({ images, stats });
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createKnowledgeImageSchema);
  if ("error" in result) return result.error;

  const image = await prisma.knowledgeImage.create({ data: result.data });
  return apiSuccess(image, 201);
}
