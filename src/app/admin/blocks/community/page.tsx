import { prisma } from "@/lib/prisma";
import { CommunityListClient } from "@/components/community/community-list-client";
import { connection } from "next/server";

export default async function CommunityPage() {
  await connection();
  const benefits = await prisma.communityBenefit.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { tierAssignments: true } } },
  });

  return <CommunityListClient initialBenefits={benefits as never} />;
}
