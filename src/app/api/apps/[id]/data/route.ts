import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { type Prisma } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const app = await prisma.knowledgeApp.findUnique({ where: { id } });
  if (!app) return apiError("Not found", 404);

  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const limit = parseInt(url.searchParams.get("limit") || "100", 10);
  const page = parseInt(url.searchParams.get("page") || "1", 10);

  const where: Prisma.KnowledgeAppDataPointWhereInput = { appId: id };
  if (category) {
    where.category = category as Prisma.KnowledgeAppDataPointWhereInput["category"];
  }
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const [dataPoints, total] = await Promise.all([
    prisma.knowledgeAppDataPoint.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.knowledgeAppDataPoint.count({ where }),
  ]);

  const serialized = dataPoints.map((dp) => ({
    id: dp.id,
    appId: dp.appId,
    category: dp.category,
    date: dp.date.toISOString(),
    textContent: dp.textContent,
    status: dp.status,
    errorMessage: dp.errorMessage,
    chunkCount: dp.chunkCount,
    processedAt: dp.processedAt?.toISOString() ?? null,
    createdAt: dp.createdAt.toISOString(),
  }));

  return apiSuccess({ dataPoints: serialized, total, page, limit });
}
