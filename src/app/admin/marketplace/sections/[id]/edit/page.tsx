import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";
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

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/admin/marketplace");

  // NetworkRole + NetworkProfileType removed in 3.5/3.6 — section gating
  // temporarily disabled until new RBAC/identity model.
  // Section read is tenant-scoped (withTenant + RLS); Setting is platform-wide.
  const section = await withTenant(orgId, () =>
    prisma.marketplaceSection.findUnique({
      where: { id },
      include: { scopes: true },
    })
  );
  const categoriesSetting = await prisma.setting.findUnique({
    where: { key: BLOCK_CATEGORIES_SETTING_KEY },
  });
  const roles: { id: string; displayName: string }[] = [];
  const profileTypes: { id: string; displayName: string }[] = [];

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
