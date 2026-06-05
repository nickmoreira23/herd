import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";
import { getViewerContext } from "@/lib/marketplace/visibility-helpers";
import { buildRenderContext } from "@/lib/marketplace/render-resolver";
import { MarketplaceSectionRenderer } from "@/components/marketplace/renderer/marketplace-section-renderer";
import { LocaleLink } from "@/components/i18n/locale-link";
import { isSupportedLocale } from "@/lib/i18n/locales";
import type { ComponentNode } from "@/types/landing-page";

interface PageParams {
  locale: string;
  slug: string;
}

/**
 * Async island. Wrapped in <Suspense> by the page so Next 16 can stream the
 * static shell first; otherwise the prerenderer aborts with "Uncached data
 * was accessed outside of <Suspense>".
 */
async function SectionContent({ slug }: { slug: string }) {
  await connection();
  const session = await auth();

  // No org for this host → no storefront, so no section.
  const orgId = await getOrgIdFromRequest();
  if (!orgId) notFound();

  const viewer = await getViewerContext(session, orgId);

  // findFirst (not findUnique): slug is unique PER TENANT now. RLS scopes the
  // read to the host org, so this resolves the org's own section by slug.
  const section = await withTenant(orgId, () =>
    prisma.marketplaceSection.findFirst({
      where: { slug },
      include: { scopes: true },
    })
  );

  if (!section || section.status !== "PUBLISHED") {
    notFound();
  }

  const ctx = await buildRenderContext(section, viewer);
  const components = Array.isArray(section.components)
    ? (section.components as unknown as ComponentNode[])
    : [];

  return (
    <>
      <div className="mt-4 mb-2">
        <h1 className="text-3xl font-bold">{section.name}</h1>
        {section.description && (
          <p className="text-muted-foreground mt-1">{section.description}</p>
        )}
      </div>
      <MarketplaceSectionRenderer
        components={components}
        ctx={ctx}
        blockNames={section.blockNames}
        sectionSlug={section.slug}
        sectionId={section.id}
        context="public"
      />
    </>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse mt-4">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-4 w-72 rounded bg-muted" />
      <div className="h-64 w-full rounded bg-muted mt-6" />
    </div>
  );
}

export default async function ExploreSectionPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale)) notFound();

  return (
    <div className="max-w-6xl mx-auto px-6">
      <LocaleLink
        href="/explore"
        className="inline-flex items-center gap-1 mt-6 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Explore
      </LocaleLink>
      <Suspense fallback={<SectionSkeleton />}>
        <SectionContent slug={slug} />
      </Suspense>
    </div>
  );
}
