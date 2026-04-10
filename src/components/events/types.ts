export interface CalendarEventAttendeeRow {
  id: string;
  eventId: string;
  email: string;
  displayName: string | null;
  responseStatus: string;
  isOrganizer: boolean;
  isSelf: boolean;
  createdAt: string;
}

export interface CalendarSyncRow {
  id: string;
  source: "GOOGLE_CALENDAR" | "OUTLOOK" | "ICAL";
  externalCalendarId: string;
  calendarName: string;
  calendarColor: string | null;
  timeZone: string | null;
  isActive: boolean;
  integrationId: string | null;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  syncToken: string | null;
  eventCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventRow {
  id: string;
  calendarSyncId: string;
  externalEventId: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  timeZone: string | null;
  status: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
  syncStatus: "SYNCED" | "STALE" | "ERROR";
  htmlLink: string | null;
  meetingUrl: string | null;
  conferenceData: unknown | null;
  recurrence: string[];
  recurringEventId: string | null;
  organizerEmail: string | null;
  organizerName: string | null;
  visibility: string | null;
  transparency: string | null;
  colorId: string | null;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
  attendees: CalendarEventAttendeeRow[];
  calendarSync: {
    id: string;
    calendarName: string;
    calendarColor: string | null;
    source: string;
    timeZone?: string | null;
  };
}

export interface IntegrationRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  status: "AVAILABLE" | "CONNECTED" | "ERROR" | "DISABLED";
  category: string;
}
