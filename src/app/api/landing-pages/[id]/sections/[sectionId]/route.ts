import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
    const body = await request.json();

    const existing = await prisma.landingPageSection.findUnique({
      where: { id: sectionId },
    });
    if (!existing) return apiError("Section not found", 404);

    const section = await prisma.landingPageSection.update({
      where: { id: sectionId },
      data: {
        ...(body.sectionType !== undefined && { sectionType: body.sectionType }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.layout !== undefined && { layout: body.layout as object }),
        ...(body.components !== undefined && { components: body.components as object }),
        ...(body.isVisible !== undefined && { isVisible: body.isVisible }),
        ...(body.isLocked !== undefined && { isLocked: body.isLocked }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
    });

    return apiSuccess({
      ...section,
      createdAt: section.createdAt.toISOString(),
      updatedAt: section.updatedAt.toISOString(),
    });
  } catch (e) {
    console.error("PATCH section error:", e);
    return apiError("Failed to update section", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
    const existing = await prisma.landingPageSection.findUnique({
      where: { id: sectionId },
    });
    if (!existing) return apiError("Section not found", 404);

    await prisma.landingPageSection.delete({ where: { id: sectionId } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE section error:", e);
    return apiError("Failed to delete section", 500);
  }
}
