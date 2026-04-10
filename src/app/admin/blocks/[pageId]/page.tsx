import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageEditor } from "@/components/landing-page/editor/page-editor";
import type { LandingPageData, SectionData, PageStyles, SectionLayout, ComponentNode } from "@/types/landing-page";
import { DEFAULT_PAGE_STYLES, DEFAULT_SECTION_LAYOUT } from "@/lib/landing-page/defaults";

export default async function PageEditorPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;

  const page = await prisma.landingPage.findUnique({
    where: { id: pageId },
  });

  if (!page) notFound();

  const sections = await prisma.landingPageSection.findMany({
    where: { pageId },
    orderBy: { sortOrder: "asc" },
  });

  const serializedPage: LandingPageData = {
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    lastPublishedAt: page.lastPublishedAt?.toISOString() ?? null,
    pageStyles: (page.pageStyles as unknown as PageStyles) ?? DEFAULT_PAGE_STYLES,
    status: page.status as LandingPageData["status"],
  };

  const serializedSections: SectionData[] = sections.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    layout: (s.layout as unknown as SectionLayout) ?? DEFAULT_SECTION_LAYOUT,
    components: (s.components as unknown as ComponentNode[]) ?? [],
  }));

  return <PageEditor initialPage={serializedPage} initialSections={serializedSections} />;
}
