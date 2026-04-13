import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { transformDataPoint } from "@/lib/apps/data-transformer";

/**
 * POST — Batch process all PENDING data points for an app.
 * Transforms each rawData JSON into natural language textContent.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const app = await prisma.knowledgeApp.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!app) return apiError("App not found", 404);

  const pendingPoints = await prisma.knowledgeAppDataPoint.findMany({
    where: { appId: id, status: "PENDING" },
    orderBy: { date: "asc" },
  });

  if (pendingPoints.length === 0) {
    return apiSuccess({ processed: 0, errors: 0 });
  }

  let processed = 0;
  let errors = 0;

  for (const dp of pendingPoints) {
    try {
      await prisma.knowledgeAppDataPoint.update({
        where: { id: dp.id },
        data: { status: "PROCESSING" },
      });

      const textContent = transformDataPoint(
        app.slug,
        dp.category,
        dp.date,
        dp.rawData
      );

      await prisma.knowledgeAppDataPoint.update({
        where: { id: dp.id },
        data: {
          status: "READY",
          textContent,
          chunkCount: Math.ceil(textContent.length / 1000),
          processedAt: new Date(),
          errorMessage: null,
        },
      });

      processed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Processing failed";
      await prisma.knowledgeAppDataPoint.update({
        where: { id: dp.id },
        data: { status: "ERROR", errorMessage: message },
      });
      errors++;
    }
  }

  return apiSuccess({ processed, errors });
}
