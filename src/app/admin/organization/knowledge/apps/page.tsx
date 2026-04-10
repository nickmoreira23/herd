import { prisma } from "@/lib/prisma";
import { KnowledgeAppTable } from "@/components/knowledge/apps/knowledge-app-table";
import { KnowledgeAppsEmpty } from "@/components/knowledge/apps/knowledge-apps-empty";
import { connection } from "next/server";

export default async function KnowledgeAppsPage() {
  await connection();
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

  if (apps.length === 0) {
    return <KnowledgeAppsEmpty />;
  }

  return (
    <KnowledgeAppTable
      initialApps={serialized}
      initialStats={stats}
    />
  );
}
