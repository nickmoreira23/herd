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

  // NetworkRole + NetworkProfileType removed in 3.5/3.6; roles + profileTypes
  // passed empty until new RBAC/identity model.
  const categoriesSetting = await prisma.setting.findUnique({
    where: { key: BLOCK_CATEGORIES_SETTING_KEY },
  });
  const roles: { id: string; displayName: string }[] = [];
  const profileTypes: { id: string; displayName: string }[] = [];

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
