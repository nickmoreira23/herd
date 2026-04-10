import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { MicrosoftCalendarService } from "@/lib/services/microsoft-calendar";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "microsoft-outlook" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Microsoft Outlook is not connected", 400);
    }

    const service = new MicrosoftCalendarService(integration.id);
    const calendars = await service.listCalendars();
    return apiSuccess({ calendars });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch calendars";
    return apiError(msg, 500);
  }
}
