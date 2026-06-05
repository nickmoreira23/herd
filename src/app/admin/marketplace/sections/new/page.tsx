import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEligibleBlocks } from "@/lib/marketplace/registry";
import {
  BLOCK_CATEGORIES_SETTING_KEY,
  parseBlockCategories,
} from "@/lib/blocks/block-categories";
import { SectionWizardShell } from "@/components/marketplace/wizard/section-wizard-shell";

export default async function NewSectionPage() {
  await connection();

  const categoriesSetting = await prisma.setting.findUnique({
    where: { key: BLOCK_CATEGORIES_SETTING_KEY },
  });
  const categories = parseBlockCategories(categoriesSetting?.value);

  return (
    <SectionWizardShell
      eligibleBlocks={getEligibleBlocks()}
      blockCategories={categories}
    />
  );
}
