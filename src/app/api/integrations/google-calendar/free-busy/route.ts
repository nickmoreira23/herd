import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { GoogleCalendarService } from "@/lib/services/google-calendar";

export async function POST(request: Request) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "google-calendar" },
    });
    if (!integration) return apiError("Google Calendar integration not found", 404);
    if (!integration.credentials) return apiError("Google Calendar not connected", 400);

    const body = await request.json();
    const { timeMin, timeMax, items, timeZone } = body;

    if (!timeMin || !timeMax || !items) {
      return apiError("timeMin, timeMax, and items are required", 400);
    }

    const svc = new GoogleCalendarService(integration.id);
    const freeBusy = await svc.getFreeBusy({ timeMin, timeMax, items, timeZone });
    return apiSuccess(freeBusy);
  } catch (e) {
    console.error("POST /api/integrations/google-calendar/free-busy error:", e);
    return apiError("Failed to fetch free/busy data", 500);
  }
}
