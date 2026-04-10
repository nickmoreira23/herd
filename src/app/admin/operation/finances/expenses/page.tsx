import { prisma } from "@/lib/prisma";
import { OperationTable } from "@/components/operations/operation-table";
import { formatNumber, formatCurrency, toNumber } from "@/lib/utils";
import { connection } from "next/server";

export default async function ExpensesPage() {
  await connection();
  const categories = await prisma.opexCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isActive: true },
        include: {
          milestones: { orderBy: { memberCount: "asc" } },
        },
      },
    },
  });

  const activeCategories = categories.filter((c) => c.isActive);
  const totalItems = activeCategories.reduce((sum, c) => sum + c.items.length, 0);
  const preLaunchCost = activeCategories.reduce((sum, c) =>
    sum + c.items.reduce((iSum, item) => {
      const m = item.milestones.find((m) => m.memberCount === 0);
      return iSum + (m ? toNumber(m.monthlyCost) : 0);
    }, 0), 0);

  const stats = [
    { label: "Categories", value: formatNumber(categories.length) },
    { label: "Active", value: formatNumber(activeCategories.length) },
    { label: "Expense Items", value: formatNumber(totalItems) },
    { label: "Pre-Launch Monthly", value: formatCurrency(preLaunchCost) },
  ];

  const serialized = categories.map((c) => ({
    ...c,
    _itemCount: c.items.length,
    _preLaunchCost: c.items.reduce((sum, item) => {
      const m = item.milestones.find((m) => m.memberCount === 0);
      return sum + (m ? toNumber(m.monthlyCost) : 0);
    }, 0),
    items: undefined,
  }));

  return <OperationTable initialCategories={serialized as never} stats={stats} />;
}
