import { prisma } from "@/lib/prisma";
import { TierDetailClient } from "@/components/tiers/tier-detail-client";
import { connection } from "next/server";
import { BENEFIT_BLOCKS_SETTING_KEY, DEFAULT_BENEFIT_BLOCKS } from "@/lib/blocks/block-meta";

export default async function NewTierPage() {
  await connection();
  const setting = await prisma.setting.findUnique({
    where: { key: BENEFIT_BLOCKS_SETTING_KEY },
  });
  const enabledBenefitBlocks = setting
    ? String(setting.value)
    : DEFAULT_BENEFIT_BLOCKS;

  return <TierDetailClient enabledBenefitBlocks={enabledBenefitBlocks} />;
}
