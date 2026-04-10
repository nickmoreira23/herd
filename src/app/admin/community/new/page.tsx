import { prisma } from "@/lib/prisma";
import { CommunityCreateWizard } from "@/components/community/community-create-wizard";

export default async function NewCommunityPage() {
  const allTiers = await prisma.subscriptionTier.findMany({
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });
  return <CommunityCreateWizard allTiers={allTiers} />;
}
