import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { IntegrationDetailClient } from "@/components/integrations/integration-detail-client";
import { connection } from "next/server";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const orgId = await getOrgIdFromRequest();

  const integration = await prisma.integration.findUnique({
    where: { id },
    include: {
      // L1b.2a — dropped the nested subscriptionTier include (joins the soon-
      // RLS-strict tier without the GUC); tier joined in memory below.
      // NOTE: tierMappings is itself tenant-scoped (IntegrationTierMapping) read
      // here via the unscoped Integration parent — pre-existing, empty in PROD,
      // out of L1b scope (its own withTenant wiring is tracked separately).
      tierMappings: {
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

  // L1b.2a — join tier into each mapping under the host org (tier traversal).
  const mappingTierIds = [...new Set(integration.tierMappings.map((m) => m.subscriptionTierId))];
  const mappingTiers = orgId
    ? await withTenant(orgId, () =>
        prisma.subscriptionTier.findMany({
          where: { id: { in: mappingTierIds } },
          select: { id: true, name: true, slug: true },
        })
      )
    : [];
  const mappingTierById = new Map(mappingTiers.map((t) => [t.id, t]));
  const integrationWithTiers = {
    ...integration,
    tierMappings: integration.tierMappings.flatMap((m) => {
      const subscriptionTier = mappingTierById.get(m.subscriptionTierId);
      if (!subscriptionTier) return [];
      return [{ ...m, subscriptionTier }];
    }),
  };

  // L1b.2a — Tier dropdown read scoped to the host org (inert until L1b.2b).
  const tiers = orgId
    ? await withTenant(orgId, () =>
        prisma.subscriptionTier.findMany({
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true, slug: true },
        })
      )
    : [];

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
      integration={JSON.parse(JSON.stringify(integrationWithTiers))}
      tiers={JSON.parse(JSON.stringify(tiers))}
      jobs={jobs}
    />
  );
}
