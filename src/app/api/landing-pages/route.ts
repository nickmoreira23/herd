import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createLandingPageSchema } from "@/lib/validators/landing-page";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");

    const pages = await prisma.landingPage.findMany({
      where: status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : undefined,
      orderBy: { updatedAt: "desc" },
    });

    const serialized = pages.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      lastPublishedAt: p.lastPublishedAt?.toISOString() ?? null,
    }));

    return apiSuccess(serialized);
  } catch (e) {
    console.error("GET /api/landing-pages error:", e);
    return apiError("Failed to fetch pages", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseAndValidate(request, createLandingPageSchema);
    if ("error" in result) return result.error;

    const existing = await prisma.landingPage.findUnique({
      where: { slug: result.data.slug },
    });
    if (existing) {
      return apiError("A page with this slug already exists", 409);
    }

    const page = await prisma.landingPage.create({
      data: {
        name: result.data.name,
        slug: result.data.slug,
        description: result.data.description,
      },
    });

    return apiSuccess(
      {
        ...page,
        createdAt: page.createdAt.toISOString(),
        updatedAt: page.updatedAt.toISOString(),
        lastPublishedAt: null,
      },
      201
    );
  } catch (e) {
    console.error("POST /api/landing-pages error:", e);
    return apiError("Failed to create page", 500);
  }
}
