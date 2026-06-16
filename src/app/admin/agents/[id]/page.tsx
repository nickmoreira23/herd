import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AgentDetailClient } from "@/components/agents/agent-detail-client";
import { toNumber } from "@/lib/utils";
import { connection } from "next/server";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const orgId = await getOrgIdFromRequest();
  const { id } = await params;

  if (id === "new") return notFound();

  const [agent, allTiers] = await Promise.all([
    prisma.agent.findUnique({
      where: { id },
      include: {
        tierAccess: {
          include: { tier: { select: { id: true, name: true } } },
        },
      },
    }),
    // L1b.2a — Tier read scoped to the host org (inert until L1b.2b activation).
    orgId
      ? withTenant(orgId, () =>
          prisma.subscriptionTier.findMany({
            select: { id: true, name: true },
            orderBy: { sortOrder: "asc" },
          })
        )
      : Promise.resolve([]),
  ]);

  if (!agent) return notFound();

  const serialized = {
    ...agent,
    temperature: agent.temperature ? toNumber(agent.temperature) : null,
    monthlyCostEstimate: agent.monthlyCostEstimate
      ? toNumber(agent.monthlyCostEstimate)
      : null,
  };

  return (
    <AgentDetailClient
      agentId={agent.id}
      initialAgent={serialized as never}
      allTiers={allTiers}
    />
  );
}
