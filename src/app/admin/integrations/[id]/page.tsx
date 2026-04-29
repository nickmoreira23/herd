import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { IntegrationDetailClient } from "@/components/integrations/integration-detail-client";
import { connection } from "next/server";

export default async function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  const integration = await prisma.integration.findUnique({
    where: { id },
    include: {
      tierMappings: {
        include: { subscriptionTier: true },
        orderBy: { createdAt: "desc" },
      },
      syncLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      webhookEvents: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!integration) notFound();

  const tiers = await prisma.subscriptionTier.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const [voiceJobs, videoJobs] = await Promise.all([
    integration.category === "VOICE"
      ? prisma.voiceJob.findMany({
          where: { integrationId: integration.id },
          orderBy: { createdAt: "desc" },
          take: 25,
        })
      : Promise.resolve([]),
    integration.category === "VIDEO"
      ? prisma.videoJob.findMany({
          where: { integrationId: integration.id },
          orderBy: { createdAt: "desc" },
          take: 25,
        })
      : Promise.resolve([]),
  ]);

  const jobs =
    integration.category === "VOICE"
      ? voiceJobs.map((j) => ({
          id: j.id,
          operation: j.operation,
          provider: j.provider,
          status: j.status,
          durationSec: j.audioDurationSec,
          createdAt: j.createdAt.toISOString(),
        }))
      : integration.category === "VIDEO"
        ? videoJobs.map((j) => ({
            id: j.id,
            operation: j.operation,
            provider: j.provider,
            status: j.status,
            durationSec: j.videoDurationSec,
            createdAt: j.createdAt.toISOString(),
          }))
        : null;

  return (
    <IntegrationDetailClient
      integration={JSON.parse(JSON.stringify(integration))}
      tiers={JSON.parse(JSON.stringify(tiers))}
      jobs={jobs}
    />
  );
}
