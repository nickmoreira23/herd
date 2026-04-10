import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { MicrosoftCalendarService } from "@/lib/services/microsoft-calendar";

export async function GET(req: NextRequest) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "microsoft-outlook" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Microsoft Outlook is not connected", 400);
    }

    const { searchParams } = new URL(req.url);
    const service = new MicrosoftCalendarService(integration.id);

    const events = await service.listEvents({
      calendarId: searchParams.get("calendarId") || undefined,
      startDateTime: searchParams.get("startDateTime") || undefined,
      endDateTime: searchParams.get("endDateTime") || undefined,
      top: searchParams.get("top") ? Number(searchParams.get("top")) : 25,
      search: searchParams.get("search") || undefined,
      orderBy: searchParams.get("orderBy") || "start/dateTime",
    });

    return apiSuccess({ events: events.value, nextLink: events["@odata.nextLink"] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch events";
    return apiError(msg, 500);
  }
}
