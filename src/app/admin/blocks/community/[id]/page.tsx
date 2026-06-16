import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CommunityDetailClient } from "@/components/community/community-detail-client";
import { connection } from "next/server";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function EditCommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const orgId = await getOrgIdFromRequest();
  const { id } = await params;
  if (id === "new") return notFound();

  const [benefit, allTiers] = await Promise.all([
    prisma.communityBenefit.findUnique({
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

  if (!benefit) return notFound();

  return <CommunityDetailClient benefitId={benefit.id} initialBenefit={benefit as never} allTiers={allTiers} />;
}
