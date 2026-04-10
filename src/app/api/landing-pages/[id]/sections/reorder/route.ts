import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: { sections: { id: string; sortOrder: number }[] } = await request.json();

    if (!Array.isArray(body.sections)) {
      return apiError("sections array is required", 400);
    }

    await Promise.all(
      body.sections.map(({ id: sectionId, sortOrder }) =>
        prisma.landingPageSection.update({
          where: { id: sectionId },
          data: { sortOrder },
        })
      )
    );

    return apiSuccess({ reordered: true });
  } catch (e) {
    console.error("PUT reorder sections error:", e);
    return apiError("Failed to reorder sections", 500);
  }
}
