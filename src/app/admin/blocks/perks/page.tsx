import { prisma } from "@/lib/prisma";
import { PerksListClient } from "@/components/perks/perks-list-client";
import { connection } from "next/server";

export default async function PerksPage() {
  await connection();
  const perks = await prisma.perk.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { tierAssignments: true } } },
  });

  return <PerksListClient initialPerks={perks as never} />;
}
