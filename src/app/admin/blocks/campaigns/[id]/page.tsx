import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CampaignDetailClient } from "@/components/campaigns/campaign-detail-client";
import type { CampaignDetail } from "@/components/campaigns/types";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      _count: { select: { deals: true } },
      deals: {
        select: {
          id: true,
          title: true,
          stage: true,
          amount: true,
          currency: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 100,
      },
    },
  });
  if (!campaign) notFound();

  const serialized: CampaignDetail = {
    ...campaign,
    budget: campaign.budget?.toString() ?? null,
    spent: campaign.spent?.toString() ?? null,
    metrics: campaign.metrics,
    contentJson: campaign.contentJson,
    startDate: campaign.startDate?.toISOString() ?? null,
    endDate: campaign.endDate?.toISOString() ?? null,
    dealCount: campaign._count.deals,
    deals: campaign.deals.map((d) => ({
      id: d.id,
      title: d.title,
      stage: d.stage,
      amount: d.amount?.toString() ?? null,
      currency: d.currency,
    })),
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  };

  return <CampaignDetailClient campaign={serialized} />;
}
