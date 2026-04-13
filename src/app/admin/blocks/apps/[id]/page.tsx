import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AppDetailClient } from "@/components/apps/app-detail-client";
import { connection } from "next/server";

export default async function AppDetailPage({
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

  const readyCount = await prisma.knowledgeAppDataPoint.count({
    where: { appId: id, status: "READY" },
  });

  const serialized = {
    ...JSON.parse(JSON.stringify(app)),
    dataPointCount: app._count.dataPoints,
    readyDataPointCount: readyCount,
  };

  delete serialized._count;

  return <AppDetailClient app={serialized} />;
}
