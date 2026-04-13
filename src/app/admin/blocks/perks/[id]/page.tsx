import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PerkDetailClient } from "@/components/perks/perk-detail-client";
import { connection } from "next/server";

export default async function EditPerkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  if (id === "new") return notFound();

  const [perk, allTiers] = await Promise.all([
    prisma.perk.findUnique({
      where: { id },
      include: { tierAssignments: { include: { tier: { select: { id: true, name: true } } } } },
    }),
    prisma.subscriptionTier.findMany({
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!perk) return notFound();

  return <PerkDetailClient perkId={perk.id} initialPerk={perk as never} allTiers={allTiers} />;
}
