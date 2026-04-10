import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { OperationDetailClient } from "@/components/operations/operation-detail-client";
import { connection } from "next/server";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  if (id === "new") return notFound();

  const [category, milestoneLevels] = await Promise.all([
    prisma.opexCategory.findUnique({
      where: { id },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            milestones: { orderBy: { memberCount: "asc" } },
          },
        },
      },
    }),
    prisma.opexMilestoneLevel.findMany({
      orderBy: { memberCount: "asc" },
    }),
  ]);

  if (!category) return notFound();

  const serialized = {
    ...category,
    items: category.items.map((item) => ({
      ...item,
      milestones: item.milestones.map((m) => ({
        ...m,
        monthlyCost: toNumber(m.monthlyCost),
      })),
    })),
  };

  return (
    <OperationDetailClient
      categoryId={category.id}
      initialCategory={serialized as never}
      milestoneLevels={milestoneLevels}
    />
  );
}
