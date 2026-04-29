import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateDealSchema } from "@/lib/validators/deals";
import { dispatchBlockEvent } from "@/lib/routines/dispatcher";
import type { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true } },
      },
    });
    if (!deal) return apiError("Deal not found", 404);
    return apiSuccess(deal);
  } catch (e) {
    console.error("GET /api/deals/[id] error:", e);
    return apiError("Failed to fetch deal", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateDealSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing) return apiError("Deal not found", 404);

    const data: Prisma.DealUpdateInput = {};

    const stringFields = [
      "title",
      "description",
      "currency",
      "lostReason",
      "source",
    ] as const;
    for (const f of stringFields) {
      if (body[f] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data as any)[f] = body[f] ?? null;
      }
    }

    if (body.stage !== undefined && body.stage !== null) data.stage = body.stage;
    if (body.amount !== undefined) data.amount = body.amount ?? null;
    if (body.probability !== undefined) data.probability = body.probability ?? null;
    if (body.expectedCloseDate !== undefined)
      data.expectedCloseDate = body.expectedCloseDate ?? null;
    if (body.closedAt !== undefined) data.closedAt = body.closedAt ?? null;
    if (body.ownerId !== undefined) data.ownerId = body.ownerId ?? null;
    if (body.contactId !== undefined) {
      data.contact = body.contactId
        ? { connect: { id: body.contactId } }
        : { disconnect: true };
    }
    if (body.companyId !== undefined) {
      data.company = body.companyId
        ? { connect: { id: body.companyId } }
        : { disconnect: true };
    }
    if (body.campaignId !== undefined) {
      data.campaign = body.campaignId
        ? { connect: { id: body.campaignId } }
        : { disconnect: true };
    }
    if (body.contentJson !== undefined)
      data.contentJson = body.contentJson as Prisma.InputJsonValue;
    if (body.contentText !== undefined) data.contentText = body.contentText;
    if (body.tags !== undefined) data.tags = body.tags;

    // Auto-set closedAt when transitioning to WON or LOST and not provided
    if (
      body.stage &&
      (body.stage === "WON" || body.stage === "LOST") &&
      body.closedAt === undefined &&
      !existing.closedAt
    ) {
      data.closedAt = new Date();
    }

    const deal = await prisma.deal.update({ where: { id }, data });

    // Fire routine events on stage transitions + a generic updated event
    if (body.stage && body.stage !== existing.stage) {
      const eventType = `stage_changed_to_${body.stage.toLowerCase()}`;
      void dispatchBlockEvent("deals", eventType, {
        dealId: deal.id,
        title: deal.title,
        previousStage: existing.stage,
        stage: deal.stage,
        amount: deal.amount?.toString() ?? null,
        currency: deal.currency,
        contactId: deal.contactId,
        companyId: deal.companyId,
        campaignId: deal.campaignId,
      });
    }
    void dispatchBlockEvent("deals", "updated", {
      dealId: deal.id,
      title: deal.title,
      stage: deal.stage,
    });

    return apiSuccess(deal);
  } catch (e) {
    console.error("PATCH /api/deals/[id] error:", e);
    return apiError("Failed to update deal", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.deal.delete({ where: { id } });
    void dispatchBlockEvent("deals", "deleted", { dealId: id });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/deals/[id] error:", e);
    return apiError("Failed to delete deal", 500);
  }
}
