import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

/**
 * Bulk sync: replaces all sections for a page with the provided set.
 * This is simpler and more reliable than tracking individual creates/updates/deletes.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!Array.isArray(body.sections)) {
      return apiError("sections array is required", 400);
    }

    // Delete all existing sections for this page
    await prisma.landingPageSection.deleteMany({ where: { pageId: id } });

    // Re-create all sections
    if (body.sections.length > 0) {
      await prisma.landingPageSection.createMany({
        data: body.sections.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          pageId: id,
          sectionType: (s.sectionType as string) || "custom",
          name: (s.name as string) || null,
          layout: (s.layout as object) || {},
          components: (s.components as object) || [],
          isVisible: (s.isVisible as boolean) ?? true,
          isLocked: (s.isLocked as boolean) ?? false,
          sortOrder: (s.sortOrder as number) ?? 0,
        })),
      });
    }

    return apiSuccess({ synced: true, count: body.sections.length });
  } catch (e) {
    console.error("PUT sections/sync error:", e);
    return apiError("Failed to sync sections", 500);
  }
}
