import { prisma } from "@/lib/prisma";
import { PerkCreateWizard } from "@/components/perks/perk-create-wizard";
import { connection } from "next/server";

export default async function NewPerkPage() {
  await connection();
  const allTiers = await prisma.subscriptionTier.findMany({
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });
  return <PerkCreateWizard allTiers={allTiers} />;
}
