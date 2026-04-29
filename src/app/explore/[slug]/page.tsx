import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getViewerContext } from "@/lib/marketplace/visibility-helpers";
import { buildRenderContext } from "@/lib/marketplace/render-resolver";
import { MarketplaceSectionRenderer } from "@/components/marketplace/renderer/marketplace-section-renderer";
import type { ComponentNode } from "@/types/landing-page";

export default async function ExploreSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const viewer = await getViewerContext(userId);

  const section = await prisma.marketplaceSection.findUnique({
    where: { slug },
    include: { scopes: true },
  });

  if (!section || section.status !== "PUBLISHED") {
    notFound();
  }

  const ctx = await buildRenderContext(section, viewer);
  const components = (Array.isArray(section.components)
    ? (section.components as unknown as ComponentNode[])
    : []);

  return (
    <div className="max-w-6xl mx-auto px-6">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1 mt-6 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Explore
      </Link>
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
    </div>
  );
}
