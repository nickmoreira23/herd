import { prisma } from "@/lib/prisma";
import { AgentDetailClient } from "@/components/agents/agent-detail-client";
import { connection } from "next/server";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function NewAgentPage() {
  await connection();
  const orgId = await getOrgIdFromRequest();
  // L1b.2a — Tier read scoped to the host org (inert until L1b.2b activation).
  const allTiers = orgId
    ? await withTenant(orgId, () =>
        prisma.subscriptionTier.findMany({
          select: { id: true, name: true },
          orderBy: { sortOrder: "asc" },
        })
      )
    : [];

  return <AgentDetailClient allTiers={allTiers} />;
}
