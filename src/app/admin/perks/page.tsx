import { prisma } from "@/lib/prisma";
import { PerkTable } from "@/components/perks/perk-table";
import { formatNumber } from "@/lib/utils";

export default async function PerksPage() {
  const perks = await prisma.perk.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { tierAssignments: true } } },
  });

  const active = perks.filter((p) => p.status === "ACTIVE");

  const stats = [
    { label: "Total Perks", value: formatNumber(perks.length) },
    { label: "Active", value: formatNumber(active.length) },
  ];

  return <PerkTable initialPerks={perks as never} stats={stats} />;
}
