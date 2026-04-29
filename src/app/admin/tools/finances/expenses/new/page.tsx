import { prisma } from "@/lib/prisma";
import { OperationDetailClient } from "@/components/operations/operation-detail-client";
import { connection } from "next/server";

export default async function NewExpensePage() {
  await connection();
  const milestoneLevels = await prisma.opexMilestoneLevel.findMany({
    orderBy: { memberCount: "asc" },
  });
  return <OperationDetailClient milestoneLevels={milestoneLevels} />;
}
