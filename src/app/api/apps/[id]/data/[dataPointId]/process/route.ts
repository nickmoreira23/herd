import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { transformDataPoint } from "@/lib/apps/data-transformer";

/**
 * POST — Process a single KnowledgeAppDataPoint.
 * Transforms rawData JSON into natural language textContent.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; dataPointId: string }> }
) {
  const { id, dataPointId } = await params;

  const dataPoint = await prisma.knowledgeAppDataPoint.findFirst({
    where: { id: dataPointId, appId: id },
    include: { app: { select: { slug: true } } },
  });
  if (!dataPoint) return apiError("Data point not found", 404);

  try {
    await prisma.knowledgeAppDataPoint.update({
      where: { id: dataPointId },
      data: { status: "PROCESSING" },
    });

    const textContent = transformDataPoint(
      dataPoint.app.slug,
      dataPoint.category,
      dataPoint.date,
      dataPoint.rawData
    );

    await prisma.knowledgeAppDataPoint.update({
      where: { id: dataPointId },
      data: {
        status: "READY",
        textContent,
        chunkCount: Math.ceil(textContent.length / 1000),
        processedAt: new Date(),
        errorMessage: null,
      },
    });

    return apiSuccess({ processed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Processing failed";
    await prisma.knowledgeAppDataPoint.update({
      where: { id: dataPointId },
      data: { status: "ERROR", errorMessage: message },
    });
    return apiError(message, 500);
  }
}
