import { prisma } from "@/lib/prisma";
import { PerkCreateWizard } from "@/components/perks/perk-create-wizard";
import { connection } from "next/server";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function NewPerkPage() {
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
  return <PerkCreateWizard allTiers={allTiers} />;
}
