import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const page = await prisma.landingPage.findUnique({ where: { id } });
    if (!page) return apiError("Page not found", 404);

    const updatedPage = await prisma.landingPage.update({
      where: { id },
      data: { status: "DRAFT" },
    });

    // Invalidate ISR cache
    revalidatePath(`/p/${page.slug}`);

    return apiSuccess({
      ...updatedPage,
      createdAt: updatedPage.createdAt.toISOString(),
      updatedAt: updatedPage.updatedAt.toISOString(),
      lastPublishedAt: updatedPage.lastPublishedAt?.toISOString() ?? null,
    });
  } catch (e) {
    console.error("POST /api/landing-pages/[id]/unpublish error:", e);
    return apiError("Failed to unpublish page", 500);
  }
}
