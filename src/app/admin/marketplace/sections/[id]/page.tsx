import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";
import { getViewerContext } from "@/lib/marketplace/visibility-helpers";
import { buildRenderContext } from "@/lib/marketplace/render-resolver";
import { MarketplaceSectionRenderer } from "@/components/marketplace/renderer/marketplace-section-renderer";
import { SectionPreviewHeader } from "@/components/marketplace/admin/section-preview-header";
import type { ComponentNode } from "@/types/landing-page";

export default async function AdminSectionPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/admin/marketplace");

  const section = await withTenant(orgId, () =>
    prisma.marketplaceSection.findUnique({
      where: { id },
      include: { scopes: true },
    })
  );
  // Section may have been deleted while the user was viewing it (or belongs to
  // another tenant — RLS hides it) — bounce back to /admin/marketplace, which
  // redirects to the first remaining section (or shows the empty state).
  if (!section) redirect("/admin/marketplace");

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const viewer = await getViewerContext(userId);

  const ctx = await buildRenderContext(section, viewer);
  const components = Array.isArray(section.components)
    ? (section.components as unknown as ComponentNode[])
    : [];

  return (
    <div className="max-w-6xl mx-auto px-6 pb-12">
      <SectionPreviewHeader
        sectionId={section.id}
        sectionName={section.name}
        sectionSlug={section.slug}
        sectionStatus={section.status}
        sectionDescription={section.description}
      />
      <MarketplaceSectionRenderer
        components={components}
        ctx={ctx}
        blockNames={section.blockNames}
        sectionSlug={section.slug}
        sectionId={section.id}
        context="admin"
      />
    </div>
  );
}
