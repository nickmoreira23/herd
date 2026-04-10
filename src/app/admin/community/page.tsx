import { prisma } from "@/lib/prisma";
import { CommunityTable } from "@/components/community/community-table";
import { formatNumber } from "@/lib/utils";
import { connection } from "next/server";

export default async function CommunityPage() {
  await connection();
  const benefits = await prisma.communityBenefit.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { tierAssignments: true } } },
  });

  const active = benefits.filter((b) => b.status === "ACTIVE");

  const stats = [
    { label: "Total Benefits", value: formatNumber(benefits.length) },
    { label: "Active", value: formatNumber(active.length) },
  ];

  return <CommunityTable initialBenefits={benefits as never} stats={stats} />;
}
