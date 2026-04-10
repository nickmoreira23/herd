import { getValidIntegrationToken } from "@/lib/services/integration-oauth";

const BASE_URL = "https://gmail.googleapis.com/gmail/v1";

// ─── Gmail API Types ────────────────────────────────────────────────

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface MessageHeader {
  name: string;
  value: string;
}

export interface MessagePartBody {
  attachmentId?: string;
  size: number;
  data?: string;
}

export interface MessagePart {
  partId: string;
  mimeType: string;
  filename: string;
  headers: MessageHeader[];
  body: MessagePartBody;
  parts?: MessagePart[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload?: MessagePart;
  sizeEstimate: number;
  raw?: string;
}

export interface GmailThread {
  id: string;
  historyId: string;
  messages?: GmailMessage[];
  snippet?: string;
}

export interface GmailLabel {
  id: string;
  name: string;
  type: "system" | "user";
  messageListVisibility?: "show" | "hide";
  labelListVisibility?: "labelShow" | "labelShowIfUnread" | "labelHide";
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
  color?: { textColor: string; backgroundColor: string };
}

export interface GmailDraft {
  id: string;
  message: GmailMessage;
}

export interface MessageListResponse {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export interface ThreadListResponse {
  threads?: { id: string; historyId: string; snippet: string }[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export interface DraftListResponse {
  drafts?: { id: string; message: { id: string; threadId: string } }[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export interface ParsedHeaders {
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
  cc?: string;
  bcc?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

export function parseMessageHeaders(message: GmailMessage): ParsedHeaders {
  const headers = message.payload?.headers ?? [];
  const result: ParsedHeaders = {};
  for (const h of headers) {
    const key = h.name.toLowerCase();
    if (key === "from") result.from = h.value;
    else if (key === "to") result.to = h.value;
    else if (key === "subject") result.subject = h.value;
    else if (key === "date") result.date = h.value;
    else if (key === "cc") result.cc = h.value;
    else if (key === "bcc") result.bcc = h.value;
  }
  return result;
}

// ─── Service Class ──────────────────────────────────────────────────

export class GmailService {
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
      throw new Error(`Gmail API error ${res.status}: ${body}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  // ── Profile ──

  async getProfile(): Promise<GmailProfile> {
    return this.request<GmailProfile>("/users/me/profile");
  }

  // ── Messages ──

  async listMessages(params?: {
    q?: string;
    maxResults?: number;
    pageToken?: string;
    labelIds?: string[];
  }): Promise<MessageListResponse> {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.maxResults) qs.set("maxResults", String(params.maxResults));
    if (params?.pageToken) qs.set("pageToken", params.pageToken);
    if (params?.labelIds) {
      for (const id of params.labelIds) qs.append("labelIds", id);
    }
    const query = qs.toString();
    return this.request<MessageListResponse>(
      `/users/me/messages${query ? `?${query}` : ""}`
    );
  }

  async getMessage(
    id: string,
    format: "full" | "metadata" | "minimal" | "raw" = "full"
  ): Promise<GmailMessage> {
    return this.request<GmailMessage>(
      `/users/me/messages/${encodeURIComponent(id)}?format=${format}`
    );
  }

  async sendMessage(raw: string): Promise<GmailMessage> {
    return this.request<GmailMessage>("/users/me/messages/send", {
      method: "POST",
      body: JSON.stringify({ raw }),
    });
  }

  async trashMessage(id: string): Promise<GmailMessage> {
    return this.request<GmailMessage>(
      `/users/me/messages/${encodeURIComponent(id)}/trash`,
      { method: "POST" }
    );
  }

  async untrashMessage(id: string): Promise<GmailMessage> {
    return this.request<GmailMessage>(
      `/users/me/messages/${encodeURIComponent(id)}/untrash`,
      { method: "POST" }
    );
  }

  async modifyMessage(
    id: string,
    addLabelIds?: string[],
    removeLabelIds?: string[]
  ): Promise<GmailMessage> {
    return this.request<GmailMessage>(
      `/users/me/messages/${encodeURIComponent(id)}/modify`,
      {
        method: "POST",
        body: JSON.stringify({ addLabelIds, removeLabelIds }),
      }
    );
  }

  // ── Threads ──

  async listThreads(params?: {
    q?: string;
    maxResults?: number;
    pageToken?: string;
    labelIds?: string[];
  }): Promise<ThreadListResponse> {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.maxResults) qs.set("maxResults", String(params.maxResults));
    if (params?.pageToken) qs.set("pageToken", params.pageToken);
    if (params?.labelIds) {
      for (const id of params.labelIds) qs.append("labelIds", id);
    }
    const query = qs.toString();
    return this.request<ThreadListResponse>(
      `/users/me/threads${query ? `?${query}` : ""}`
    );
  }

  async getThread(
    id: string,
    format: "full" | "metadata" | "minimal" = "full"
  ): Promise<GmailThread> {
    return this.request<GmailThread>(
      `/users/me/threads/${encodeURIComponent(id)}?format=${format}`
    );
  }

  // ── Labels ──

  async listLabels(): Promise<GmailLabel[]> {
    const data = await this.request<{ labels: GmailLabel[] }>(
      "/users/me/labels"
    );
    return data.labels;
  }

  async getLabel(id: string): Promise<GmailLabel> {
    return this.request<GmailLabel>(
      `/users/me/labels/${encodeURIComponent(id)}`
    );
  }

  async createLabel(label: {
    name: string;
    messageListVisibility?: "show" | "hide";
    labelListVisibility?: "labelShow" | "labelShowIfUnread" | "labelHide";
    color?: { textColor: string; backgroundColor: string };
  }): Promise<GmailLabel> {
    return this.request<GmailLabel>("/users/me/labels", {
      method: "POST",
      body: JSON.stringify(label),
    });
  }

  async updateLabel(
    id: string,
    label: {
      name?: string;
      messageListVisibility?: "show" | "hide";
      labelListVisibility?: "labelShow" | "labelShowIfUnread" | "labelHide";
      color?: { textColor: string; backgroundColor: string };
    }
  ): Promise<GmailLabel> {
    return this.request<GmailLabel>(
      `/users/me/labels/${encodeURIComponent(id)}`,
      { method: "PUT", body: JSON.stringify(label) }
    );
  }

  async deleteLabel(id: string): Promise<void> {
    await this.request<void>(
      `/users/me/labels/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  }

  // ── Drafts ──

  async listDrafts(params?: {
    maxResults?: number;
    pageToken?: string;
  }): Promise<DraftListResponse> {
    const qs = new URLSearchParams();
    if (params?.maxResults) qs.set("maxResults", String(params.maxResults));
    if (params?.pageToken) qs.set("pageToken", params.pageToken);
    const query = qs.toString();
    return this.request<DraftListResponse>(
      `/users/me/drafts${query ? `?${query}` : ""}`
    );
  }

  async getDraft(
    id: string,
    format: "full" | "metadata" | "minimal" = "full"
  ): Promise<GmailDraft> {
    return this.request<GmailDraft>(
      `/users/me/drafts/${encodeURIComponent(id)}?format=${format}`
    );
  }

  async createDraft(message: { raw: string }): Promise<GmailDraft> {
    return this.request<GmailDraft>("/users/me/drafts", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  async updateDraft(
    id: string,
    message: { raw: string }
  ): Promise<GmailDraft> {
    return this.request<GmailDraft>(
      `/users/me/drafts/${encodeURIComponent(id)}`,
      { method: "PUT", body: JSON.stringify({ message }) }
    );
  }

  async deleteDraft(id: string): Promise<void> {
    await this.request<void>(
      `/users/me/drafts/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  }

  async sendDraft(id: string): Promise<GmailMessage> {
    return this.request<GmailMessage>("/users/me/drafts/send", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  }
}
