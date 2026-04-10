import { prisma } from "@/lib/prisma";
import { CommunityCreateWizard } from "@/components/community/community-create-wizard";
import { connection } from "next/server";

export default async function NewCommunityPage() {
  await connection();
  const allTiers = await prisma.subscriptionTier.findMany({
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });
  return <CommunityCreateWizard allTiers={allTiers} />;
}
