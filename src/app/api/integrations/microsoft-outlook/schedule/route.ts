import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { MicrosoftCalendarService } from "@/lib/services/microsoft-calendar";

export async function POST(req: NextRequest) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "microsoft-outlook" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Microsoft Outlook is not connected", 400);
    }

    const body = await req.json();
    const service = new MicrosoftCalendarService(integration.id);
    const schedule = await service.getSchedule(body);
    return apiSuccess({ schedule: schedule.value });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch schedule";
    return apiError(msg, 500);
  }
}
