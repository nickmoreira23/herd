import { prisma } from "@/lib/prisma";
import { AgentTable } from "@/components/agents/agent-table";
import { toNumber, formatNumber, formatCurrency } from "@/lib/utils";
import { connection } from "next/server";

export default async function AgentsPage() {
  await connection();
  const agents = await prisma.agent.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { tierAccess: true } },
    },
  });

  const activeAgents = agents.filter((a) => a.status === "ACTIVE");
  const betaAgents = agents.filter((a) => a.status === "BETA");

  const totalMonthlyCost = activeAgents.reduce(
    (sum, a) => sum + (a.monthlyCostEstimate ? toNumber(a.monthlyCostEstimate) : 0),
    0
  );

  const stats = [
    { label: "Total Agents", value: formatNumber(agents.length) },
    { label: "Active", value: formatNumber(activeAgents.length) },
    ...(betaAgents.length > 0
      ? [{ label: "In Beta", value: formatNumber(betaAgents.length) }]
      : []),
    ...(totalMonthlyCost > 0
      ? [{ label: "Est. Monthly AI Cost", value: formatCurrency(totalMonthlyCost) }]
      : []),
  ];

  // Serialize Decimal values for the client
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
