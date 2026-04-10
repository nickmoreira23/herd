import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { KnowledgeAppDetailClient } from "@/components/knowledge/apps/knowledge-app-detail-client";
import { connection } from "next/server";

export default async function KnowledgeAppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  const app = await prisma.knowledgeApp.findUnique({
    where: { id },
    include: {
      _count: { select: { dataPoints: true } },
      syncLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!app) notFound();

  // Count ready data points separately
  const readyCount = await prisma.knowledgeAppDataPoint.count({
    where: { appId: id, status: "READY" },
  });

  const serialized = {
    ...JSON.parse(JSON.stringify(app)),
    dataPointCount: app._count.dataPoints,
    readyDataPointCount: readyCount,
  };

  // Remove the _count field since we've flattened it
  delete serialized._count;

  return <KnowledgeAppDetailClient app={serialized} />;
}
