import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createPerkSchema } from "@/lib/validators/perk";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const sort = searchParams.get("sort") || "sortOrder";
    const order = searchParams.get("order") === "desc" ? "desc" : "asc";

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { key: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && { status: status as "DRAFT" | "ACTIVE" | "ARCHIVED" }),
    };

    const perks = await prisma.perk.findMany({
      where,
      orderBy: { [sort]: order },
      include: {
        _count: {
          select: { tierAssignments: true },
        },
      },
    });

    return apiSuccess(perks);
  } catch (e) {
    console.error("GET /api/perks error:", e);
    return apiError("Failed to fetch perks", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseAndValidate(request, createPerkSchema);
    if ("error" in result) return result.error;

    const existing = await prisma.perk.findUnique({
      where: { key: result.data.key },
    });
    if (existing) {
      return apiError("A perk with this key already exists", 409);
    }

    const perk = await prisma.perk.create({
      data: {
        ...result.data,
        tags: result.data.tags || [],
        subConfigOptions: result.data.subConfigOptions || [],
      },
    });

    return apiSuccess(perk, 201);
  } catch (e) {
    console.error("POST /api/perks error:", e);
    return apiError("Failed to create perk", 500);
  }
}
