import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DealDetailClient } from "@/components/deals/deal-detail-client";
import type { DealDetail } from "@/components/deals/types";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      contact: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      company: { select: { id: true, name: true } },
      campaign: { select: { id: true, name: true } },
    },
  });
  if (!deal) notFound();

  const serialized: DealDetail = {
    ...deal,
    amount: deal.amount?.toString() ?? null,
    contentJson: deal.contentJson,
    expectedCloseDate: deal.expectedCloseDate?.toISOString() ?? null,
    closedAt: deal.closedAt?.toISOString() ?? null,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
  };

  return <DealDetailClient deal={serialized} />;
}
