import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { GoogleCalendarService } from "@/lib/services/google-calendar";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { calendarId } = await params;
    const integration = await prisma.integration.findUnique({
      where: { slug: "google-calendar" },
    });
    if (!integration) return apiError("Google Calendar integration not found", 404);
    if (!integration.credentials) return apiError("Google Calendar not connected", 400);

    const svc = new GoogleCalendarService(integration.id);
    const calendar = await svc.getCalendar(calendarId);
    return apiSuccess(calendar);
  } catch (e) {
    console.error("GET /api/integrations/google-calendar/calendars/[id] error:", e);
    return apiError("Failed to fetch calendar", 500);
  }
}
