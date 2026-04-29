import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateCampaignSchema } from "@/lib/validators/campaigns";
import { dispatchBlockEvent } from "@/lib/routines/dispatcher";
import type { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        _count: { select: { deals: true } },
        deals: {
          select: {
            id: true,
            title: true,
            stage: true,
            amount: true,
            currency: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 50,
        },
      },
    });
    if (!campaign) return apiError("Campaign not found", 404);
    return apiSuccess(campaign);
  } catch (e) {
    console.error("GET /api/campaigns/[id] error:", e);
    return apiError("Failed to fetch campaign", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateCampaignSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) return apiError("Campaign not found", 404);

    const data: Prisma.CampaignUpdateInput = {};
    const stringFields = [
      "name",
      "description",
      "currency",
      "audience",
    ] as const;
    for (const f of stringFields) {
      if (body[f] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data as any)[f] = body[f] ?? null;
      }
    }
    if (body.status !== undefined && body.status !== null) data.status = body.status;
    if (body.channels !== undefined) data.channels = body.channels;
    if (body.objective !== undefined) data.objective = body.objective ?? null;
    if (body.startDate !== undefined) data.startDate = body.startDate ?? null;
    if (body.endDate !== undefined) data.endDate = body.endDate ?? null;
    if (body.budget !== undefined) data.budget = body.budget ?? null;
    if (body.spent !== undefined) data.spent = body.spent ?? null;
    if (body.ownerId !== undefined) data.ownerId = body.ownerId ?? null;
    if (body.metrics !== undefined)
      data.metrics = body.metrics as Prisma.InputJsonValue;
    if (body.contentJson !== undefined)
      data.contentJson = body.contentJson as Prisma.InputJsonValue;
    if (body.contentText !== undefined) data.contentText = body.contentText;
    if (body.tags !== undefined) data.tags = body.tags;

    const campaign = await prisma.campaign.update({ where: { id }, data });

    // Lifecycle events on status transitions
    if (body.status && body.status !== existing.status) {
      const lifecycle: Record<string, string | null> = {
        ACTIVE: "activated",
        PAUSED: "paused",
        COMPLETED: "completed",
      };
      const eventType = lifecycle[body.status] ?? null;
      if (eventType) {
        void dispatchBlockEvent("campaigns", eventType, {
          campaignId: campaign.id,
          name: campaign.name,
        });
      }
    }
    return apiSuccess(campaign);
  } catch (e) {
    console.error("PATCH /api/campaigns/[id] error:", e);
    return apiError("Failed to update campaign", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.campaign.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/campaigns/[id] error:", e);
    return apiError("Failed to delete campaign", 500);
  }
}
