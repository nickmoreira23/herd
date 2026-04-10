import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { MicrosoftCalendarService } from "@/lib/services/microsoft-calendar";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const integration = await prisma.integration.findUnique({
      where: { slug: "microsoft-outlook" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Microsoft Outlook is not connected", 400);
    }

    const service = new MicrosoftCalendarService(integration.id);
    const event = await service.getEvent(eventId);
    return apiSuccess({ event });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch event";
    return apiError(msg, 500);
  }
}
