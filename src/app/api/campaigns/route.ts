import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createCampaignSchema } from "@/lib/validators/campaigns";
import { dispatchBlockEvent } from "@/lib/routines/dispatcher";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const objective = searchParams.get("objective");
    const ownerId = searchParams.get("ownerId");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "200", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const where: Prisma.CampaignWhereInput = {};
    if (status) where.status = status as Prisma.CampaignWhereInput["status"];
    if (channel)
      where.channels = { has: channel as Prisma.Enumerable<never> as never };
    if (objective)
      where.objective = objective as Prisma.CampaignWhereInput["objective"];
    if (ownerId) where.ownerId = ownerId;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { audience: { contains: search, mode: "insensitive" } },
        { contentText: { contains: search, mode: "insensitive" } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: { _count: { select: { deals: true } } },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.campaign.count({ where }),
    ]);

    return apiSuccess({ campaigns, total });
  } catch (e) {
    console.error("GET /api/campaigns error:", e);
    return apiError("Failed to fetch campaigns", 500);
  }
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createCampaignSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const campaign = await prisma.campaign.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        status: body.status ?? "DRAFT",
        channels: body.channels ?? [],
        objective: body.objective ?? null,
        startDate: body.startDate ?? null,
        endDate: body.endDate ?? null,
        budget: body.budget ?? null,
        spent: body.spent ?? null,
        currency: body.currency ?? "BRL",
        audience: body.audience ?? null,
        ownerId: body.ownerId ?? null,
        metrics: (body.metrics ?? {}) as Prisma.InputJsonValue,
        contentJson: (body.contentJson ?? {}) as Prisma.InputJsonValue,
        contentText: body.contentText ?? "",
        tags: body.tags ?? [],
      },
    });
    void dispatchBlockEvent("campaigns", "created", {
      campaignId: campaign.id,
      name: campaign.name,
      status: campaign.status,
    });
    return apiSuccess(campaign, 201);
  } catch (e) {
    console.error("POST /api/campaigns error:", e);
    return apiError("Failed to create campaign", 500);
  }
}
