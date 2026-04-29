import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEligibleBlocks } from "@/lib/marketplace/registry";
import {
  BLOCK_CATEGORIES_SETTING_KEY,
  parseBlockCategories,
} from "@/lib/blocks/block-categories";
import {
  SectionWizardShell,
  type InitialSectionForEdit,
} from "@/components/marketplace/wizard/section-wizard-shell";
import type { ComponentNode } from "@/types/landing-page";

export default async function EditSectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  const [section, profileTypes, roles, categoriesSetting] = await Promise.all([
    prisma.marketplaceSection.findUnique({
      where: { id },
      include: { scopes: true },
    }),
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

  if (!section) redirect("/admin/marketplace");
  const categories = parseBlockCategories(categoriesSetting?.value);

  const initial: InitialSectionForEdit = {
    id: section.id,
    slug: section.slug,
    name: section.name,
    description: section.description,
    iconKey: section.iconKey,
    imageUrl: section.imageUrl,
    creationPath: section.creationPath,
    status: section.status,
    blockNames: section.blockNames,
    components: Array.isArray(section.components)
      ? (section.components as unknown as ComponentNode[])
      : [],
    scopes: section.scopes.map((s) => ({
      id: s.id,
      blockName: s.blockName,
      scopeType: s.scopeType,
      scopeValue: s.scopeValue,
      sortOrder: s.sortOrder,
      allowedProfileTypeIds: s.allowedProfileTypeIds,
      allowedRoleIds: s.allowedRoleIds,
    })),
  };

  return (
    <SectionWizardShell
      eligibleBlocks={getEligibleBlocks()}
      profileTypes={profileTypes}
      roles={roles}
      blockCategories={categories}
      initialSection={initial}
    />
  );
}
