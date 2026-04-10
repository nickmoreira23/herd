import { getValidIntegrationToken } from "@/lib/services/integration-oauth";

const BASE_URL = "https://api.zoom.us/v2";

// ─── Zoom API Types ─────────────────────────────────────────────────

export interface ZoomUserProfile {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  type: number; // 1=Basic, 2=Licensed, 3=On-Prem, 99=None
  role_name: string;
  pmi: number;
  timezone: string;
  dept: string;
  created_at: string;
  last_login_time: string;
  pic_url: string;
  status: "active" | "inactive" | "pending";
  account_id: string;
  language: string;
  phone_country: string;
  phone_number: string;
  personal_meeting_url: string;
}

export interface ZoomMeeting {
  id: number;
  uuid: string;
  topic: string;
  type: number; // 1=Instant, 2=Scheduled, 3=Recurring/no-fixed, 8=Recurring/fixed
  status: "waiting" | "started";
  start_time: string;
  duration: number; // minutes
  timezone: string;
  agenda: string;
  created_at: string;
  join_url: string;
  start_url: string;
  password: string;
  host_id: string;
  host_email: string;
  pmi?: number;
  tracking_fields?: Array<{ field: string; value: string }>;
  occurrences?: Array<{
    occurrence_id: string;
    start_time: string;
    duration: number;
    status: string;
  }>;
  settings?: ZoomMeetingSettings;
}

export interface ZoomMeetingSettings {
  host_video: boolean;
  participant_video: boolean;
  join_before_host: boolean;
  mute_upon_entry: boolean;
  watermark: boolean;
  use_pmi: boolean;
  approval_type: number;
  audio: "both" | "telephony" | "voip" | "thirdParty";
  auto_recording: "local" | "cloud" | "none";
  waiting_room: boolean;
  meeting_authentication: boolean;
}

export interface ZoomMeetingListResponse {
  page_count: number;
  page_number: number;
  page_size: number;
  total_records: number;
  next_page_token: string;
  meetings: ZoomMeeting[];
}

export interface ZoomParticipant {
  id: string;
  name: string;
  user_email: string;
  join_time: string;
  leave_time: string;
  duration: number;
  status: "in_meeting" | "in_waiting_room";
}

export interface ZoomRecording {
  id: string;
  meeting_id: string;
  recording_start: string;
  recording_end: string;
  file_type: string;
  file_extension: string;
  file_size: number;
  play_url: string;
  download_url: string;
  status: string;
  recording_type: string;
}

export interface ZoomRecordingResponse {
  uuid: string;
  id: number;
  host_id: string;
  host_email: string;
  topic: string;
  start_time: string;
  duration: number;
  total_size: number;
  recording_count: number;
  recording_files: ZoomRecording[];
}

export interface ZoomRecordingListResponse {
  from: string;
  to: string;
  page_count: number;
  page_size: number;
  total_records: number;
  next_page_token: string;
  meetings: ZoomRecordingResponse[];
}

export interface CreateZoomMeetingInput {
  topic: string;
  type?: number;
  start_time?: string;
  duration?: number;
  timezone?: string;
  agenda?: string;
  password?: string;
  settings?: Partial<ZoomMeetingSettings>;
}

// ─── Service Class ──────────────────────────────────────────────────

export class ZoomService {
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
      throw new Error(`Zoom API error ${res.status}: ${body}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  // ── User ──

  async getUserProfile(): Promise<ZoomUserProfile> {
    return this.request<ZoomUserProfile>("/users/me");
  }

  // ── Meetings ──

  async listMeetings(params?: {
    type?: "scheduled" | "live" | "upcoming" | "upcoming_meetings" | "previous_meetings";
    pageSize?: number;
    nextPageToken?: string;
  }): Promise<ZoomMeetingListResponse> {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.pageSize) qs.set("page_size", String(params.pageSize));
    if (params?.nextPageToken) qs.set("next_page_token", params.nextPageToken);
    const query = qs.toString();
    return this.request<ZoomMeetingListResponse>(
      `/users/me/meetings${query ? `?${query}` : ""}`
    );
  }

  async getMeeting(meetingId: string | number): Promise<ZoomMeeting> {
    return this.request<ZoomMeeting>(`/meetings/${meetingId}`);
  }

  async createMeeting(meeting: CreateZoomMeetingInput): Promise<ZoomMeeting> {
    return this.request<ZoomMeeting>("/users/me/meetings", {
      method: "POST",
      body: JSON.stringify(meeting),
    });
  }

  async updateMeeting(
    meetingId: string | number,
    meeting: Partial<CreateZoomMeetingInput>
  ): Promise<void> {
    await this.request<void>(`/meetings/${meetingId}`, {
      method: "PATCH",
      body: JSON.stringify(meeting),
    });
  }

  async deleteMeeting(meetingId: string | number): Promise<void> {
    await this.request<void>(`/meetings/${meetingId}`, {
      method: "DELETE",
    });
  }

  // ── Upcoming Meetings ──

  async listUpcomingMeetings(): Promise<ZoomMeetingListResponse> {
    return this.listMeetings({ type: "upcoming_meetings", pageSize: 50 });
  }

  // ── Participants (past meetings) ──

  async listParticipants(meetingId: string): Promise<{
    page_count: number;
    page_size: number;
    total_records: number;
    participants: ZoomParticipant[];
  }> {
    return this.request(`/past_meetings/${meetingId}/participants`);
  }

  // ── Recordings ──

  async listRecordings(params?: {
    from?: string;
    to?: string;
    pageSize?: number;
    nextPageToken?: string;
  }): Promise<ZoomRecordingListResponse> {
    const qs = new URLSearchParams();
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.pageSize) qs.set("page_size", String(params.pageSize));
    if (params?.nextPageToken) qs.set("next_page_token", params.nextPageToken);
    const query = qs.toString();
    return this.request<ZoomRecordingListResponse>(
      `/users/me/recordings${query ? `?${query}` : ""}`
    );
  }

  async getRecording(meetingId: string | number): Promise<ZoomRecordingResponse> {
    return this.request<ZoomRecordingResponse>(`/meetings/${meetingId}/recordings`);
  }
}
