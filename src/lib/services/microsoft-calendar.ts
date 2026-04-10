import { getValidIntegrationToken } from "@/lib/services/integration-oauth";

const BASE_URL = "https://graph.microsoft.com/v1.0";

// ─── Microsoft Graph Calendar API Types ──────────────────────────────

export interface OutlookCalendar {
  id: string;
  name: string;
  color: string;
  isDefaultCalendar: boolean;
  canEdit: boolean;
  canShare: boolean;
  canViewPrivateItems: boolean;
  owner?: { name: string; address: string };
  hexColor?: string;
  changeKey?: string;
}

export interface OutlookEventDateTime {
  dateTime: string;
  timeZone: string;
}

export interface OutlookAttendee {
  emailAddress: { name: string; address: string };
  type: "required" | "optional" | "resource";
  status?: {
    response: "none" | "organizer" | "tentativelyAccepted" | "accepted" | "declined" | "notResponded";
    time: string;
  };
}

export interface OutlookLocation {
  displayName: string;
  locationType?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    countryOrRegion?: string;
    postalCode?: string;
  };
}

export interface OutlookOnlineMeeting {
  joinUrl: string;
  conferenceId?: string;
  tollNumber?: string;
}

export interface OutlookEvent {
  id: string;
  subject: string;
  bodyPreview: string;
  body?: { contentType: string; content: string };
  start: OutlookEventDateTime;
  end: OutlookEventDateTime;
  location?: OutlookLocation;
  locations?: OutlookLocation[];
  attendees?: OutlookAttendee[];
  organizer?: { emailAddress: { name: string; address: string } };
  isOnlineMeeting: boolean;
  onlineMeetingProvider?: "teamsForBusiness" | "skypeForBusiness" | "skypeForConsumer" | "unknown";
  onlineMeeting?: OutlookOnlineMeeting;
  onlineMeetingUrl?: string;
  webLink?: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  isAllDay: boolean;
  isCancelled: boolean;
  showAs: "free" | "tentative" | "busy" | "oof" | "workingElsewhere" | "unknown";
  importance: "low" | "normal" | "high";
  sensitivity: "normal" | "personal" | "private" | "confidential";
  recurrence?: Record<string, unknown>;
  seriesMasterId?: string;
  type: "singleInstance" | "occurrence" | "exception" | "seriesMaster";
  categories?: string[];
  responseStatus?: {
    response: string;
    time: string;
  };
}

export interface OutlookEventListResponse {
  value: OutlookEvent[];
  "@odata.nextLink"?: string;
}

export interface OutlookCalendarListResponse {
  value: OutlookCalendar[];
  "@odata.nextLink"?: string;
}

export interface OutlookUserProfile {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  officeLocation?: string;
}

export interface CreateOutlookEventInput {
  subject: string;
  body?: { contentType: "text" | "html"; content: string };
  start: OutlookEventDateTime;
  end: OutlookEventDateTime;
  location?: { displayName: string };
  attendees?: { emailAddress: { name?: string; address: string }; type?: string }[];
  isOnlineMeeting?: boolean;
  onlineMeetingProvider?: string;
  showAs?: string;
  importance?: string;
  categories?: string[];
  recurrence?: Record<string, unknown>;
}

// ─── Service Class ──────────────────────────────────────────────────

export class MicrosoftCalendarService {
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
      throw new Error(`Microsoft Graph API error ${res.status}: ${body}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  // ── User Profile ──

  async getUserProfile(): Promise<OutlookUserProfile> {
    return this.request<OutlookUserProfile>("/me");
  }

  // ── Calendars ──

  async listCalendars(): Promise<OutlookCalendar[]> {
    const data = await this.request<OutlookCalendarListResponse>("/me/calendars");
    return data.value;
  }

  async getCalendar(calendarId: string): Promise<OutlookCalendar> {
    return this.request<OutlookCalendar>(`/me/calendars/${calendarId}`);
  }

  // ── Events ──

  async listEvents(params?: {
    calendarId?: string;
    startDateTime?: string;
    endDateTime?: string;
    top?: number;
    skip?: number;
    search?: string;
    orderBy?: string;
    select?: string[];
  }): Promise<OutlookEventListResponse> {
    const qs = new URLSearchParams();
    if (params?.startDateTime && params?.endDateTime) {
      qs.set("startDateTime", params.startDateTime);
      qs.set("endDateTime", params.endDateTime);
    }
    if (params?.top) qs.set("$top", String(params.top));
    if (params?.skip) qs.set("$skip", String(params.skip));
    if (params?.search) qs.set("$filter", `contains(subject,'${params.search}')`);
    if (params?.orderBy) qs.set("$orderby", params.orderBy);
    if (params?.select) qs.set("$select", params.select.join(","));

    const query = qs.toString();
    const basePath = params?.calendarId
      ? `/me/calendars/${params.calendarId}/calendarView`
      : "/me/calendarView";

    // calendarView requires startDateTime and endDateTime
    if (params?.startDateTime && params?.endDateTime) {
      return this.request<OutlookEventListResponse>(
        `${basePath}${query ? `?${query}` : ""}`
      );
    }

    // Without date range, use /events endpoint instead
    const eventsPath = params?.calendarId
      ? `/me/calendars/${params.calendarId}/events`
      : "/me/events";
    return this.request<OutlookEventListResponse>(
      `${eventsPath}${query ? `?${query}` : ""}`
    );
  }

  async getEvent(eventId: string): Promise<OutlookEvent> {
    return this.request<OutlookEvent>(`/me/events/${eventId}`);
  }

  async createEvent(event: CreateOutlookEventInput, calendarId?: string): Promise<OutlookEvent> {
    const path = calendarId
      ? `/me/calendars/${calendarId}/events`
      : "/me/events";
    return this.request<OutlookEvent>(path, {
      method: "POST",
      body: JSON.stringify(event),
    });
  }

  async updateEvent(eventId: string, event: Partial<CreateOutlookEventInput>): Promise<OutlookEvent> {
    return this.request<OutlookEvent>(`/me/events/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify(event),
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.request<void>(`/me/events/${eventId}`, {
      method: "DELETE",
    });
  }

  // ── Schedule (Free/Busy) ──

  async getSchedule(params: {
    schedules: string[];
    startTime: OutlookEventDateTime;
    endTime: OutlookEventDateTime;
    availabilityViewInterval?: number;
  }): Promise<{
    value: Array<{
      scheduleId: string;
      availabilityView: string;
      scheduleItems: Array<{
        status: string;
        start: OutlookEventDateTime;
        end: OutlookEventDateTime;
        subject?: string;
      }>;
    }>;
  }> {
    return this.request("/me/calendar/getSchedule", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }
}
