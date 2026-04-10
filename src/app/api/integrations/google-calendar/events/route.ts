import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { GoogleCalendarService } from "@/lib/services/google-calendar";

export async function GET(request: Request) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "google-calendar" },
    });
    if (!integration) return apiError("Google Calendar integration not found", 404);
    if (!integration.credentials) return apiError("Google Calendar not connected", 400);

    const svc = new GoogleCalendarService(integration.id);
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get("calendarId") || "primary";
    const timeMin = searchParams.get("timeMin") || undefined;
    const timeMax = searchParams.get("timeMax") || undefined;
    const maxResults = searchParams.get("maxResults")
      ? parseInt(searchParams.get("maxResults")!)
      : undefined;
    const pageToken = searchParams.get("pageToken") || undefined;
    const q = searchParams.get("q") || undefined;
    const singleEvents = searchParams.get("singleEvents") === "true" ? true : undefined;
    const orderBy = (searchParams.get("orderBy") as "startTime" | "updated") || undefined;

    const events = await svc.listEvents(calendarId, {
      timeMin,
      timeMax,
      maxResults,
      pageToken,
      q,
      singleEvents,
      orderBy,
    });
    return apiSuccess(events);
  } catch (e) {
    console.error("GET /api/integrations/google-calendar/events error:", e);
    return apiError("Failed to fetch events", 500);
  }
}

export async function POST(request: Request) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "google-calendar" },
    });
    if (!integration) return apiError("Google Calendar integration not found", 404);
    if (!integration.credentials) return apiError("Google Calendar not connected", 400);

    const body = await request.json();
    const { calendarId = "primary", ...eventData } = body;

    const svc = new GoogleCalendarService(integration.id);
    const event = await svc.createEvent(calendarId, eventData);
    return apiSuccess(event);
  } catch (e) {
    console.error("POST /api/integrations/google-calendar/events error:", e);
    return apiError("Failed to create event", 500);
  }
}
