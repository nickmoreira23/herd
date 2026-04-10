import { getValidIntegrationToken } from "@/lib/services/integration-oauth";

const BASE_URL = "https://www.googleapis.com/calendar/v3";

// ─── Google Calendar API Types ──────────────────────────────────────

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  primary?: boolean;
  accessRole: "freeBusyReader" | "reader" | "writer" | "owner";
}

export interface EventAttendee {
  email: string;
  displayName?: string;
  responseStatus: "needsAction" | "declined" | "tentative" | "accepted";
  organizer?: boolean;
  self?: boolean;
}

export interface EventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface EventReminder {
  method: "email" | "popup";
  minutes: number;
}

export interface CalendarEvent {
  id: string;
  status: "confirmed" | "tentative" | "cancelled";
  summary?: string;
  description?: string;
  location?: string;
  start: EventDateTime;
  end: EventDateTime;
  created: string;
  updated: string;
  creator?: { email: string; displayName?: string; self?: boolean };
  organizer?: { email: string; displayName?: string; self?: boolean };
  attendees?: EventAttendee[];
  recurrence?: string[];
  recurringEventId?: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: Record<string, unknown>;
  colorId?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: EventReminder[];
  };
  visibility?: "default" | "public" | "private" | "confidential";
  transparency?: "opaque" | "transparent";
}

export interface CalendarListResponse {
  kind: string;
  items: GoogleCalendar[];
  nextPageToken?: string;
}

export interface EventListResponse {
  kind: string;
  summary: string;
  updated: string;
  timeZone: string;
  items: CalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

export interface FreeBusyRequest {
  timeMin: string;
  timeMax: string;
  items: { id: string }[];
  timeZone?: string;
}

export interface FreeBusyResponse {
  kind: string;
  timeMin: string;
  timeMax: string;
  calendars: Record<
    string,
    {
      busy: { start: string; end: string }[];
      errors?: { domain: string; reason: string }[];
    }
  >;
}

export interface CalendarSetting {
  id: string;
  value: string;
}

export interface CalendarColors {
  calendar: Record<string, { background: string; foreground: string }>;
  event: Record<string, { background: string; foreground: string }>;
}

export interface CreateEventInput {
  summary?: string;
  description?: string;
  location?: string;
  start: EventDateTime;
  end: EventDateTime;
  attendees?: { email: string; displayName?: string }[];
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: EventReminder[];
  };
  visibility?: "default" | "public" | "private" | "confidential";
  transparency?: "opaque" | "transparent";
  conferenceData?: Record<string, unknown>;
  colorId?: string;
}

// ─── Service Class ──────────────────────────────────────────────────

export class GoogleCalendarService {
  private integrationId: string;

  constructor(integrationId: string) {
    this.integrationId = integrationId;
  }

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<T> {
    const token = await getValidIntegrationToken(this.integrationId);
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Google Calendar API error ${res.status}: ${body}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  // ── Calendars ──

  async listCalendars(): Promise<GoogleCalendar[]> {
    const data = await this.request<CalendarListResponse>(
      "/users/me/calendarList"
    );
    return data.items;
  }

  async getCalendar(calendarId: string): Promise<GoogleCalendar> {
    return this.request<GoogleCalendar>(
      `/users/me/calendarList/${encodeURIComponent(calendarId)}`
    );
  }

  // ── Events ──

  async listEvents(
    calendarId: string,
    params?: {
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
      pageToken?: string;
      q?: string;
      singleEvents?: boolean;
      orderBy?: "startTime" | "updated";
      syncToken?: string;
    }
  ): Promise<EventListResponse> {
    const qs = new URLSearchParams();
    if (params?.syncToken) {
      // Incremental sync — only syncToken and pageToken are valid
      qs.set("syncToken", params.syncToken);
    } else {
      if (params?.timeMin) qs.set("timeMin", params.timeMin);
      if (params?.timeMax) qs.set("timeMax", params.timeMax);
      if (params?.singleEvents != null)
        qs.set("singleEvents", String(params.singleEvents));
      if (params?.orderBy) qs.set("orderBy", params.orderBy);
      if (params?.q) qs.set("q", params.q);
    }
    if (params?.maxResults) qs.set("maxResults", String(params.maxResults));
    if (params?.pageToken) qs.set("pageToken", params.pageToken);
    const query = qs.toString();
    return this.request<EventListResponse>(
      `/calendars/${encodeURIComponent(calendarId)}/events${query ? `?${query}` : ""}`
    );
  }

  async getEvent(
    calendarId: string,
    eventId: string
  ): Promise<CalendarEvent> {
    return this.request<CalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
    );
  }

  async createEvent(
    calendarId: string,
    event: CreateEventInput
  ): Promise<CalendarEvent> {
    return this.request<CalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      { method: "POST", body: JSON.stringify(event) }
    );
  }

  async updateEvent(
    calendarId: string,
    eventId: string,
    event: Partial<CreateEventInput>
  ): Promise<CalendarEvent> {
    return this.request<CalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: "PUT", body: JSON.stringify(event) }
    );
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    await this.request<void>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: "DELETE" }
    );
  }

  // ── Free/Busy ──

  async getFreeBusy(params: FreeBusyRequest): Promise<FreeBusyResponse> {
    return this.request<FreeBusyResponse>("/freeBusy", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // ── Settings & Colors ──

  async getSettings(): Promise<CalendarSetting[]> {
    const data = await this.request<{ items: CalendarSetting[] }>(
      "/users/me/settings"
    );
    return data.items;
  }

  async getColors(): Promise<CalendarColors> {
    return this.request<CalendarColors>("/colors");
  }
}
