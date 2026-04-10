import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createProfileTypeSchema } from "@/lib/validators/network-profile-type";

type NetworkType = "INTERNAL" | "EXTERNAL";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const networkType = searchParams.get("network_type") as NetworkType | null;
    const isActive = searchParams.get("is_active");

    const profileTypes = await prisma.networkProfileType.findMany({
      where: {
        ...(networkType && { networkType }),
        ...(isActive !== null && { isActive: isActive === "true" }),
      },
      include: {
        _count: { select: { profiles: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }],
    });

    const result = profileTypes.map((pt) => ({
      ...pt,
      canDelete: pt._count.profiles === 0,
    }));

    return apiSuccess(result);
  } catch (error) {
    console.error("GET /api/network/profile-types", error);
    return apiError("Failed to fetch profile types", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseAndValidate(request, createProfileTypeSchema);
    if ("error" in result) return result.error;
    const { data } = result;

    const existing = await prisma.networkProfileType.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      return apiError("A profile type with this slug already exists", 409);
    }

    const profileType = await prisma.networkProfileType.create({
      data: {
        ...data,
        wizardFields: data.wizardFields as object[],
      },
    });

    return apiSuccess(profileType, 201);
  } catch (error) {
    console.error("POST /api/network/profile-types", error);
    return apiError("Failed to create profile type", 500);
  }
}
