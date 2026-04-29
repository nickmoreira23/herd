import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createExperienceSchema } from "@/lib/validators/experiences";
import { dispatchBlockEvent } from "@/lib/routines/dispatcher";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const format = searchParams.get("format");
    const hostId = searchParams.get("hostId");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "200", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const where: Prisma.ExperienceWhereInput = {};
    if (status) where.status = status as Prisma.ExperienceWhereInput["status"];
    if (format) where.format = format as Prisma.ExperienceWhereInput["format"];
    if (hostId) where.hostId = hostId;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { headline: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { locationName: { contains: search, mode: "insensitive" } },
        { contentText: { contains: search, mode: "insensitive" } },
      ];
    }

    const [experiences, total] = await Promise.all([
      prisma.experience.findMany({
        where,
        orderBy: [{ startDate: "asc" }, { updatedAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      prisma.experience.count({ where }),
    ]);

    return apiSuccess({ experiences, total });
  } catch (e) {
    console.error("GET /api/experiences error:", e);
    return apiError("Failed to fetch experiences", 500);
  }
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createExperienceSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const exp = await prisma.experience.create({
      data: {
        name: body.name,
        headline: body.headline ?? null,
        description: body.description ?? null,
        format: body.format ?? "IN_PERSON",
        status: body.status ?? "DRAFT",
        startDate: body.startDate ?? null,
        endDate: body.endDate ?? null,
        durationMin: body.durationMin ?? null,
        locationName: body.locationName ?? null,
        locationUrl: body.locationUrl ?? null,
        capacity: body.capacity ?? null,
        price: body.price ?? null,
        currency: body.currency ?? "BRL",
        coverImageUrl: body.coverImageUrl ?? null,
        hostId: body.hostId ?? null,
        contentJson: (body.contentJson ?? {}) as Prisma.InputJsonValue,
        contentText: body.contentText ?? "",
        tags: body.tags ?? [],
      },
    });
    void dispatchBlockEvent("experiences", "created", {
      experienceId: exp.id,
      name: exp.name,
      status: exp.status,
    });
    return apiSuccess(exp, 201);
  } catch (e) {
    console.error("POST /api/experiences error:", e);
    return apiError("Failed to create experience", 500);
  }
}
