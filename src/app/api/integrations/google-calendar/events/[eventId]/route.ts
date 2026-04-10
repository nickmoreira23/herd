import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { GoogleCalendarService } from "@/lib/services/google-calendar";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const integration = await prisma.integration.findUnique({
      where: { slug: "google-calendar" },
    });
    if (!integration) return apiError("Google Calendar integration not found", 404);
    if (!integration.credentials) return apiError("Google Calendar not connected", 400);

    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get("calendarId") || "primary";

    const svc = new GoogleCalendarService(integration.id);
    const event = await svc.getEvent(calendarId, eventId);
    return apiSuccess(event);
  } catch (e) {
    console.error("GET /api/integrations/google-calendar/events/[id] error:", e);
    return apiError("Failed to fetch event", 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const integration = await prisma.integration.findUnique({
      where: { slug: "google-calendar" },
    });
    if (!integration) return apiError("Google Calendar integration not found", 404);
    if (!integration.credentials) return apiError("Google Calendar not connected", 400);

    const body = await request.json();
    const { calendarId = "primary", ...eventData } = body;

    const svc = new GoogleCalendarService(integration.id);
    const event = await svc.updateEvent(calendarId, eventId, eventData);
    return apiSuccess(event);
  } catch (e) {
    console.error("PUT /api/integrations/google-calendar/events/[id] error:", e);
    return apiError("Failed to update event", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const integration = await prisma.integration.findUnique({
      where: { slug: "google-calendar" },
    });
    if (!integration) return apiError("Google Calendar integration not found", 404);
    if (!integration.credentials) return apiError("Google Calendar not connected", 400);

    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get("calendarId") || "primary";

    const svc = new GoogleCalendarService(integration.id);
    await svc.deleteEvent(calendarId, eventId);
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/integrations/google-calendar/events/[id] error:", e);
    return apiError("Failed to delete event", 500);
  }
}
