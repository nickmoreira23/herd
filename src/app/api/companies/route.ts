import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createCompanySchema } from "@/lib/validators/companies";
import { dispatchBlockEvent } from "@/lib/routines/dispatcher";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get("industry");
    const size = searchParams.get("size");
    const ownerId = searchParams.get("ownerId");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "200", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const where: Prisma.CompanyWhereInput = {};
    if (industry) where.industry = industry;
    if (size) where.size = size as Prisma.CompanyWhereInput["size"];
    if (ownerId) where.ownerId = ownerId;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { legalName: { contains: search, mode: "insensitive" } },
        { domain: { contains: search, mode: "insensitive" } },
        { website: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { contentText: { contains: search, mode: "insensitive" } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: { _count: { select: { contacts: true } } },
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.company.count({ where }),
    ]);

    return apiSuccess({ companies, total });
  } catch (e) {
    console.error("GET /api/companies error:", e);
    return apiError("Failed to fetch companies", 500);
  }
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createCompanySchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const company = await prisma.company.create({
      data: {
        name: body.name,
        legalName: body.legalName ?? null,
        taxId: body.taxId ?? null,
        website: body.website ?? null,
        domain: body.domain ?? null,
        logoUrl: body.logoUrl ?? null,
        industry: body.industry ?? null,
        size: body.size ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        linkedinUrl: body.linkedinUrl ?? null,
        twitterHandle: body.twitterHandle ?? null,
        street: body.street ?? null,
        street2: body.street2 ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        zip: body.zip ?? null,
        country: body.country ?? null,
        description: body.description ?? null,
        contentJson: (body.contentJson ?? {}) as Prisma.InputJsonValue,
        contentText: body.contentText ?? "",
        ownerId: body.ownerId ?? null,
        tags: body.tags ?? [],
      },
    });
    void dispatchBlockEvent("companies", "created", {
      companyId: company.id,
      name: company.name,
      domain: company.domain,
      industry: company.industry,
    });
    return apiSuccess(company, 201);
  } catch (e) {
    console.error("POST /api/companies error:", e);
    return apiError("Failed to create company", 500);
  }
}
