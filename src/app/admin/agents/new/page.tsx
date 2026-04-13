import { prisma } from "@/lib/prisma";
import { AgentDetailClient } from "@/components/agents/agent-detail-client";
import { connection } from "next/server";

export default async function NewAgentPage() {
  await connection();
  const allTiers = await prisma.subscriptionTier.findMany({
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  return <AgentDetailClient allTiers={allTiers} />;
}
