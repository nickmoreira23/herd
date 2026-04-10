import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createCommunityBenefitSchema } from "@/lib/validators/community";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || undefined;

    const where = {
      ...(status && { status: status as "DRAFT" | "ACTIVE" | "ARCHIVED" }),
    };

    const benefits = await prisma.communityBenefit.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { tierAssignments: true },
        },
      },
    });

    return apiSuccess(benefits);
  } catch (e) {
    console.error("GET /api/community error:", e);
    return apiError("Failed to fetch community benefits", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseAndValidate(request, createCommunityBenefitSchema);
    if ("error" in result) return result.error;

    const existing = await prisma.communityBenefit.findUnique({
      where: { key: result.data.key },
    });
    if (existing) {
      return apiError("A community benefit with this key already exists", 409);
    }

    const benefit = await prisma.communityBenefit.create({
      data: {
        ...result.data,
        tags: result.data.tags || [],
      },
    });

    return apiSuccess(benefit, 201);
  } catch (e) {
    console.error("POST /api/community error:", e);
    return apiError("Failed to create community benefit", 500);
  }
}
