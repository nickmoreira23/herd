import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import type { PageSnapshot, SectionSnapshot, SectionLayout, ComponentNode, PageStyles } from "@/types/landing-page";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const page = await prisma.landingPage.findUnique({ where: { id } });
    if (!page) return apiError("Page not found", 404);

    // Fetch current sections
    const sections = await prisma.landingPageSection.findMany({
      where: { pageId: id },
      orderBy: { sortOrder: "asc" },
    });

    // Build snapshot
    const snapshot: PageSnapshot = {
      pageStyles: page.pageStyles as unknown as PageStyles,
      sections: sections.map((s) => ({
        id: s.id,
        sectionType: s.sectionType,
        name: s.name,
        layout: s.layout as unknown as SectionLayout,
        components: s.components as unknown as ComponentNode[],
        isVisible: s.isVisible,
        sortOrder: s.sortOrder,
      })) satisfies SectionSnapshot[],
    };

    // Determine next version number
    const lastVersion = await prisma.landingPageVersion.findFirst({
      where: { pageId: id },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });
    const nextVersion = (lastVersion?.versionNumber ?? 0) + 1;

    // Create version and update page in a transaction
    const [version, updatedPage] = await prisma.$transaction([
      prisma.landingPageVersion.create({
        data: {
          pageId: id,
          versionNumber: nextVersion,
          label: `v${nextVersion}`,
          snapshot: snapshot as unknown as object,
        },
      }),
      prisma.landingPage.update({
        where: { id },
        data: {
          status: "PUBLISHED",
          publishedVersionId: undefined, // will be set below
          lastPublishedAt: new Date(),
        },
      }),
    ]);

    // Update publishedVersionId
    await prisma.landingPage.update({
      where: { id },
      data: { publishedVersionId: version.id },
    });

    // Invalidate ISR cache for this page
    revalidatePath(`/p/${page.slug}`);

    return apiSuccess({
      ...updatedPage,
      publishedVersionId: version.id,
      versionNumber: nextVersion,
      slug: page.slug,
      createdAt: updatedPage.createdAt.toISOString(),
      updatedAt: updatedPage.updatedAt.toISOString(),
      lastPublishedAt: updatedPage.lastPublishedAt?.toISOString() ?? null,
    });
  } catch (e) {
    console.error("POST /api/landing-pages/[id]/publish error:", e);
    return apiError("Failed to publish page", 500);
  }
}
