import { prisma } from "@/lib/prisma";
import { apiSuccess, parseAndValidate } from "@/lib/api-utils";
import { createKnowledgeAppSchema } from "@/lib/validators/knowledge-app";

export async function GET() {
  const apps = await prisma.knowledgeApp.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { dataPoints: true } },
      dataPoints: { where: { status: "READY" }, select: { id: true } },
    },
  });

  const serialized = apps.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    logoUrl: a.logoUrl,
    websiteUrl: a.websiteUrl,
    category: a.category,
    status: a.status,
    isActive: a.isActive,
    authType: a.authType,
    syncFrequencyMin: a.syncFrequencyMin,
    dataCategories: a.dataCategories,
    connectedAt: a.connectedAt?.toISOString() ?? null,
    lastSyncAt: a.lastSyncAt?.toISOString() ?? null,
    errorMessage: a.errorMessage,
    createdAt: a.createdAt.toISOString(),
    dataPointCount: a._count.dataPoints,
    readyDataPointCount: a.dataPoints.length,
  }));

  const stats = {
    total: apps.length,
    connected: apps.filter((a) => a.status === "READY" && a.credentials).length,
    syncing: apps.filter((a) => a.status === "PROCESSING").length,
    error: apps.filter((a) => a.status === "ERROR").length,
    totalDataPoints: apps.reduce((sum, a) => sum + a._count.dataPoints, 0),
  };

  return apiSuccess({ apps: serialized, stats });
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createKnowledgeAppSchema);
  if ("error" in result) return result.error;

  const app = await prisma.knowledgeApp.create({
    data: {
      slug: result.data.slug,
      name: result.data.name,
      description: result.data.description || null,
      logoUrl: result.data.logoUrl || null,
      websiteUrl: result.data.websiteUrl || null,
      category: result.data.category || "FITNESS",
      authType: result.data.authType || "oauth2",
      syncFrequencyMin: result.data.syncFrequencyMin || 1440,
      dataCategories: result.data.dataCategories || [],
      status: "PENDING",
    },
  });

  return apiSuccess(app, 201);
}
