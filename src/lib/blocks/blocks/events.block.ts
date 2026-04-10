import type { BlockManifest } from "../manifest";

export const eventsBlock: BlockManifest = {
  name: "events",
  displayName: "Events",
  description:
    "Calendar event management — syncs events from Google Calendar and Microsoft Outlook into HERD. Supports listing, filtering by date range and calendar, calendar sync triggers, and calendar connection management. Events are read from external calendars via incremental sync.",
  domain: "operations",
  types: ["event"],
  capabilities: ["read", "sync"],
  models: ["CalendarEvent", "CalendarEventAttendee", "CalendarEventSync"],
  dependencies: ["integrations"],
  paths: {
    components: "src/components/events/",
    pages: "src/app/admin/blocks/events/",
    api: "src/app/api/events/",
    lib: "src/lib/events/",
    validators: "src/lib/validators/event.ts",
    provider: "src/lib/chat/providers/event.provider.ts",
  },
  actions: [
    {
      name: "list_events",
      description:
        "List calendar events with optional filters for date range, calendar, and keyword search",
      method: "GET",
      endpoint: "/api/events",
      parametersSchema: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description: "ISO date string, defaults to today",
          },
          endDate: {
            type: "string",
            description: "ISO date string, defaults to +90 days",
          },
          calendarId: {
            type: "string",
            description: "UUID of CalendarEventSync to filter by",
          },
          search: {
            type: "string",
            description: "Keyword filter on title/description/location",
          },
          limit: {
            type: "number",
            description: "Max results (default 200, max 500)",
          },
        },
      },
      responseDescription: "Array of event objects with attendees and calendar info",
    },
    {
      name: "get_event",
      description: "Get a single calendar event by ID with full attendee and calendar details",
      method: "GET",
      endpoint: "/api/events/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Event UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Single event with attendees and calendar info",
    },
    {
      name: "sync_calendars",
      description:
        "Trigger a manual sync of all connected calendars to pull latest events from Google Calendar / Outlook",
      method: "POST",
      endpoint: "/api/events/sync",
      parametersSchema: { type: "object", properties: {} },
      responseDescription:
        "Sync stats: calendars processed, events upserted, events deleted, errors",
    },
    {
      name: "list_calendars",
      description: "List all synced calendars with event counts",
      method: "GET",
      endpoint: "/api/events/calendars",
      parametersSchema: { type: "object", properties: {} },
      responseDescription: "Array of calendar sync records with event counts",
    },
    {
      name: "toggle_calendar",
      description: "Enable or disable syncing for a specific calendar",
      method: "PATCH",
      endpoint: "/api/events/calendars/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "CalendarEventSync UUID" },
          isActive: { type: "boolean", description: "Whether to sync this calendar" },
        },
        required: ["id", "isActive"],
      },
      requiredFields: ["id", "isActive"],
      responseDescription: "Updated calendar sync record",
    },
  ],
};
