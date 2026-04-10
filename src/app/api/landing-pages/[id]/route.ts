import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateLandingPageSchema } from "@/lib/validators/landing-page";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const page = await prisma.landingPage.findUnique({ where: { id } });
    if (!page) return apiError("Page not found", 404);

    return apiSuccess({
      ...page,
      createdAt: page.createdAt.toISOString(),
      updatedAt: page.updatedAt.toISOString(),
      lastPublishedAt: page.lastPublishedAt?.toISOString() ?? null,
    });
  } catch (e) {
    console.error("GET /api/landing-pages/[id] error:", e);
    return apiError("Failed to fetch page", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, updateLandingPageSchema);
    if ("error" in result) return result.error;

    const existing = await prisma.landingPage.findUnique({ where: { id } });
    if (!existing) return apiError("Page not found", 404);

    // Check slug uniqueness if changing
    if (result.data.slug && result.data.slug !== existing.slug) {
      const slugTaken = await prisma.landingPage.findUnique({
        where: { slug: result.data.slug },
      });
      if (slugTaken) return apiError("A page with this slug already exists", 409);
    }

    const { pageStyles, ...rest } = result.data;
    const page = await prisma.landingPage.update({
      where: { id },
      data: {
        ...rest,
        ...(pageStyles !== undefined && { pageStyles: pageStyles as object }),
      },
    });

    return apiSuccess({
      ...page,
      createdAt: page.createdAt.toISOString(),
      updatedAt: page.updatedAt.toISOString(),
      lastPublishedAt: page.lastPublishedAt?.toISOString() ?? null,
    });
  } catch (e) {
    console.error("PATCH /api/landing-pages/[id] error:", e);
    return apiError("Failed to update page", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.landingPage.findUnique({ where: { id } });
    if (!existing) return apiError("Page not found", 404);

    await prisma.landingPage.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/landing-pages/[id] error:", e);
    return apiError("Failed to delete page", 500);
  }
}
