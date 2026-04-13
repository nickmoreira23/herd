import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AgentDetailClient } from "@/components/agents/agent-detail-client";
import { toNumber } from "@/lib/utils";
import { connection } from "next/server";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
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
    prisma.subscriptionTier.findMany({
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
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
