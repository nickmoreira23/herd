import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { DealsClient } from "@/components/deals/deals-client";
import type { DealRow } from "@/components/deals/types";
import DealsLoading from "./loading";
import { connection } from "next/server";

async function DealsContent() {
  await connection();
  const deals = await prisma.deal.findMany({
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      company: { select: { id: true, name: true } },
      campaign: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const serialized: DealRow[] = deals.map((d) => ({
    ...d,
    amount: d.amount?.toString() ?? null,
    contentJson: d.contentJson,
    expectedCloseDate: d.expectedCloseDate?.toISOString() ?? null,
    closedAt: d.closedAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  return <DealsClient initialDeals={serialized} />;
}

export default function DealsPage() {
  return (
    <Suspense fallback={<DealsLoading />}>
      <DealsContent />
    </Suspense>
  );
}
