import { prisma } from "@/lib/prisma";
import { OperationDetailClient } from "@/components/operations/operation-detail-client";

export default async function NewExpensePage() {
  const milestoneLevels = await prisma.opexMilestoneLevel.findMany({
    orderBy: { memberCount: "asc" },
  });
  return <OperationDetailClient milestoneLevels={milestoneLevels} />;
}
