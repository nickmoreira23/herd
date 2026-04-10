import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CommunityDetailClient } from "@/components/community/community-detail-client";

export default async function EditCommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === "new") return notFound();

  const [benefit, allTiers] = await Promise.all([
    prisma.communityBenefit.findUnique({
      where: { id },
      include: { tierAssignments: { include: { tier: { select: { id: true, name: true } } } } },
    }),
    prisma.subscriptionTier.findMany({
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!benefit) return notFound();

  return <CommunityDetailClient benefitId={benefit.id} initialBenefit={benefit as never} allTiers={allTiers} />;
}
