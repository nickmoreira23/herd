import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PerkDetailClient } from "@/components/perks/perk-detail-client";
import { connection } from "next/server";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function EditPerkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const orgId = await getOrgIdFromRequest();
  const { id } = await params;
  if (id === "new") return notFound();

  const [perk, allTiers] = await Promise.all([
    prisma.perk.findUnique({
      where: { id },
      include: { tierAssignments: { include: { tier: { select: { id: true, name: true } } } } },
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

  if (!perk) return notFound();

  return <PerkDetailClient perkId={perk.id} initialPerk={perk as never} allTiers={allTiers} />;
}
