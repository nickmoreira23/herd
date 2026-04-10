import { prisma } from "@/lib/prisma";
import { MilestonesClient } from "@/components/operations/milestones-client";
import { connection } from "next/server";

export default async function MilestonesPage() {
  await connection();
  const levels = await prisma.opexMilestoneLevel.findMany({
    orderBy: { memberCount: "asc" },
  });
  return <MilestonesClient initialLevels={levels as never} />;
}
