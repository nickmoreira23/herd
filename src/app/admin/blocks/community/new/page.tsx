import { prisma } from "@/lib/prisma";
import { CommunityCreateWizard } from "@/components/community/community-create-wizard";
import { connection } from "next/server";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function NewCommunityPage() {
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
  return <CommunityCreateWizard allTiers={allTiers} />;
}
