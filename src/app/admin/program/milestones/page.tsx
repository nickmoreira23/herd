import { prisma } from "@/lib/prisma";
import { MilestonesClient } from "@/components/operations/milestones-client";

export default async function MilestonesPage() {
  const levels = await prisma.opexMilestoneLevel.findMany({
    orderBy: { memberCount: "asc" },
  });
  return <MilestonesClient initialLevels={levels as never} />;
}
