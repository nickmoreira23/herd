import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createServiceSchema, slugify } from "@/lib/validators/services";
import type { Prisma } from "@prisma/client";

async function uniqueKey(base: string): Promise<string> {
  let candidate = base || "service";
  let suffix = 0;
  // try a few times — collisions are rare
  while (await prisma.service.findUnique({ where: { key: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const pricingType = searchParams.get("pricingType");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "200", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const where: Prisma.ServiceWhereInput = {};
    if (category) where.category = category;
    if (status) where.status = status as Prisma.ServiceWhereInput["status"];
    if (pricingType)
      where.pricingType = pricingType as Prisma.ServiceWhereInput["pricingType"];
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { key: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { contentText: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        take: limit,
        skip: offset,
      }),
      prisma.service.count({ where }),
    ]);

    return apiSuccess({ services, total });
  } catch (e) {
    console.error("GET /api/services error:", e);
    return apiError("Failed to fetch services", 500);
  }
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createServiceSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const requestedKey = body.key?.trim() || slugify(body.name);
    if (!requestedKey) {
      return apiError("Could not derive a key from name", 400);
    }
    const key = body.key
      ? requestedKey
      : await uniqueKey(requestedKey);

    if (body.key) {
      const existing = await prisma.service.findUnique({ where: { key } });
      if (existing) return apiError("Key already exists", 409);
    }

    const service = await prisma.service.create({
      data: {
        name: body.name,
        key,
        description: body.description ?? null,
        contentJson: (body.contentJson ?? {}) as Prisma.InputJsonValue,
        contentText: body.contentText ?? "",
        category: body.category ?? null,
        duration: body.duration ?? null,
        price: body.price ?? null,
        pricingType: body.pricingType ?? "FIXED",
        imageUrl: body.imageUrl ?? null,
        icon: body.icon ?? "briefcase",
        status: body.status ?? "DRAFT",
        sortOrder: body.sortOrder ?? 0,
        tags: body.tags ?? [],
      },
    });
    return apiSuccess(service, 201);
  } catch (e) {
    console.error("POST /api/services error:", e);
    return apiError("Failed to create service", 500);
  }
}
