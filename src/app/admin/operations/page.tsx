import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { OperationsClient } from "@/components/operations/operations-client";
import { connection } from "next/server";

export default async function OperationsPage() {
  await connection();
  const milestoneLevels = await prisma.opexMilestoneLevel.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const categories = await prisma.opexCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          milestones: {
            orderBy: { memberCount: "asc" },
          },
        },
      },
    },
  });

  // Serialize Decimal values
  const serialized = categories.map((cat) => ({
    ...cat,
    items: cat.items.map((item) => ({
      ...item,
      milestones: item.milestones.map((m) => ({
        ...m,
        monthlyCost: toNumber(m.monthlyCost),
      })),
    })),
  }));

  return <OperationsClient initialCategories={serialized} initialMilestoneLevels={milestoneLevels} />;
}
