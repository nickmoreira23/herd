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

  const [profileTypes, roles, categoriesSetting] = await Promise.all([
    prisma.networkProfileType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, displayName: true },
    }),
    prisma.networkRole.findMany({
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true },
    }),
    prisma.setting.findUnique({ where: { key: BLOCK_CATEGORIES_SETTING_KEY } }),
  ]);

  const categories = parseBlockCategories(categoriesSetting?.value);

  return (
    <SectionWizardShell
      eligibleBlocks={getEligibleBlocks()}
      profileTypes={profileTypes}
      roles={roles}
      blockCategories={categories}
    />
  );
}
