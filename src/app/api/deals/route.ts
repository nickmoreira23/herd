import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createDealSchema } from "@/lib/validators/deals";
import { dispatchBlockEvent } from "@/lib/routines/dispatcher";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    const contactId = searchParams.get("contactId");
    const companyId = searchParams.get("companyId");
    const campaignId = searchParams.get("campaignId");
    const ownerId = searchParams.get("ownerId");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "200", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const where: Prisma.DealWhereInput = {};
    if (stage) where.stage = stage as Prisma.DealWhereInput["stage"];
    if (contactId) where.contactId = contactId;
    if (companyId) where.companyId = companyId;
    if (campaignId) where.campaignId = campaignId;
    if (ownerId) where.ownerId = ownerId;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { contentText: { contains: search, mode: "insensitive" } },
        { source: { contains: search, mode: "insensitive" } },
        { contact: { firstName: { contains: search, mode: "insensitive" } } },
        { contact: { lastName: { contains: search, mode: "insensitive" } } },
        { company: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          company: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.deal.count({ where }),
    ]);

    return apiSuccess({ deals, total });
  } catch (e) {
    console.error("GET /api/deals error:", e);
    return apiError("Failed to fetch deals", 500);
  }
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createDealSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const deal = await prisma.deal.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        stage: body.stage ?? "LEAD",
        amount: body.amount ?? null,
        currency: body.currency ?? "BRL",
        probability: body.probability ?? null,
        expectedCloseDate: body.expectedCloseDate ?? null,
        closedAt: body.closedAt ?? null,
        lostReason: body.lostReason ?? null,
        contactId: body.contactId ?? null,
        companyId: body.companyId ?? null,
        campaignId: body.campaignId ?? null,
        ownerId: body.ownerId ?? null,
        source: body.source ?? null,
        contentJson: (body.contentJson ?? {}) as Prisma.InputJsonValue,
        contentText: body.contentText ?? "",
        tags: body.tags ?? [],
      },
    });
    void dispatchBlockEvent("deals", "created", {
      dealId: deal.id,
      title: deal.title,
      stage: deal.stage,
      amount: deal.amount?.toString() ?? null,
      currency: deal.currency,
    });
    return apiSuccess(deal, 201);
  } catch (e) {
    console.error("POST /api/deals error:", e);
    return apiError("Failed to create deal", 500);
  }
}
