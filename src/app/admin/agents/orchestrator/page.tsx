import { prisma } from "@/lib/prisma";
import { AgentTable } from "@/components/agents/agent-table";
import { toNumber, formatNumber } from "@/lib/utils";
import { connection } from "next/server";

export default async function OrchestratorAgentsPage() {
  await connection();
  const agents = await prisma.agent.findMany({
    where: { role: "ORCHESTRATOR" },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { tierAccess: true } } },
  });

  const stats = [
    { label: "Orchestrator Agents", value: formatNumber(agents.length) },
  ];

  const serializedAgents = agents.map((a) => ({
    ...a,
    temperature: a.temperature != null ? toNumber(a.temperature) : null,
    monthlyCostEstimate: a.monthlyCostEstimate != null ? toNumber(a.monthlyCostEstimate) : null,
  }));

  return (
    <AgentTable
      initialAgents={serializedAgents as never}
      stats={stats}
    />
  );
}
