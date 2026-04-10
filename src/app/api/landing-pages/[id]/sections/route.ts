import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sections = await prisma.landingPageSection.findMany({
      where: { pageId: id },
      orderBy: { sortOrder: "asc" },
    });

    const serialized = sections.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return apiSuccess(serialized);
  } catch (e) {
    console.error("GET sections error:", e);
    return apiError("Failed to fetch sections", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const section = await prisma.landingPageSection.create({
      data: {
        ...(body.id && { id: body.id }),
        pageId: id,
        sectionType: body.sectionType || "custom",
        name: body.name || null,
        layout: (body.layout as object) || {},
        components: (body.components as object) || [],
        isVisible: body.isVisible ?? true,
        isLocked: body.isLocked ?? false,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    return apiSuccess(
      {
        ...section,
        createdAt: section.createdAt.toISOString(),
        updatedAt: section.updatedAt.toISOString(),
      },
      201
    );
  } catch (e) {
    console.error("POST section error:", e);
    return apiError("Failed to create section", 500);
  }
}
