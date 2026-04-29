import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CampaignsClient } from "@/components/campaigns/campaigns-client";
import type { CampaignRow } from "@/components/campaigns/types";
import CampaignsLoading from "./loading";
import { connection } from "next/server";

async function CampaignsContent() {
  await connection();
  const campaigns = await prisma.campaign.findMany({
    include: { _count: { select: { deals: true } } },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const serialized: CampaignRow[] = campaigns.map((c) => ({
    ...c,
    budget: c.budget?.toString() ?? null,
    spent: c.spent?.toString() ?? null,
    metrics: c.metrics,
    contentJson: c.contentJson,
    startDate: c.startDate?.toISOString() ?? null,
    endDate: c.endDate?.toISOString() ?? null,
    dealCount: c._count.deals,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return <CampaignsClient initialCampaigns={serialized} />;
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<CampaignsLoading />}>
      <CampaignsContent />
    </Suspense>
  );
}
