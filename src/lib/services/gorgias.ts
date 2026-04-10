// ─── Gorgias API Types ─────────────────────────────────────────────

export interface GorgiasAccount {
  id: number;
  name: string;
  domain: string;
  created_datetime: string;
}

export interface GorgiasUser {
  id: number;
  email: string;
  name: string;
  role: string;
  bio: string | null;
  created_datetime: string;
}

export interface GorgiasCustomer {
  id: number;
  email: string;
  name: string;
  firstname: string | null;
  lastname: string | null;
  note: string | null;
  external_id: string | null;
  channels: { type: string; address: string }[];
  created_datetime: string;
  updated_datetime: string;
}

export interface GorgiasMessage {
  id: number;
  uri: string;
  body_html: string | null;
  body_text: string | null;
  channel: string;
  via: string;
  from_agent: boolean;
  sender: { id: number; email: string; name: string } | null;
  receiver: { id: number; email: string; name: string } | null;
  created_datetime: string;
  attachments: { url: string; name: string; size: number; content_type: string }[];
}

export interface GorgiasTicket {
  id: number;
  uri: string;
  external_id: string | null;
  subject: string | null;
  status: string;
  priority: string;
  channel: string;
  via: string;
  from_agent: boolean;
  customer: { id: number; email: string; name: string } | null;
  assignee_user: GorgiasUser | null;
  assignee_team: { id: number; name: string } | null;
  tags: { id: number; name: string }[];
  messages_count: number;
  excerpt: string | null;
  opened_datetime: string | null;
  closed_datetime: string | null;
  created_datetime: string;
  updated_datetime: string;
  last_received_message_datetime: string | null;
  last_message_datetime: string | null;
  messages?: GorgiasMessage[];
  satisfaction_survey?: {
    id: number;
    score: number | null;
    comment: string | null;
    created_datetime: string;
    sent_datetime: string | null;
    scored_datetime: string | null;
  } | null;
}

export interface GorgiasTag {
  id: number;
  name: string;
  uri: string;
  created_datetime: string;
  decoration: { emoji: string } | null;
}

export interface GorgiasView {
  id: number;
  name: string;
  slug: string;
  type: string;
  visibility: string;
  shared: boolean;
  decorator: { emoji: string } | null;
  created_datetime: string;
  updated_datetime: string;
}

export interface GorgiasChannel {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  created_datetime: string;
  updated_datetime: string;
}

export interface GorgiasTeam {
  id: number;
  name: string;
  member_count: number;
  decoration: { emoji: string } | null;
  created_datetime: string;
  updated_datetime: string;
}

export interface GorgiasMacro {
  id: number;
  name: string;
  body_html: string | null;
  body_text: string | null;
  created_datetime: string;
  updated_datetime: string;
}

export interface GorgiasRule {
  id: number;
  name: string;
  description: string | null;
  enabled: boolean;
  type: string;
  created_datetime: string;
  updated_datetime: string;
}

export interface GorgiasSatisfactionSurvey {
  id: number;
  ticket_id: number;
  score: number | null;
  comment: string | null;
  customer: { id: number; email: string; name: string } | null;
  created_datetime: string;
  sent_datetime: string | null;
  scored_datetime: string | null;
}

export interface GorgiasStatistics {
  tickets_created: number;
  tickets_closed: number;
  tickets_reopened: number;
  first_response_time: { average: number | null; median: number | null };
  resolution_time: { average: number | null; median: number | null };
  satisfaction_score: number | null;
}

export interface GorgiasWebhook {
  id: number;
  url: string;
  event_type: string;
  created_datetime: string;
  updated_datetime: string;
}

interface GorgiasPaginatedResponse<T> {
  data: T[];
  meta?: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    next_cursor?: string | null;
  };
}

// ─── Service Class ──────────────────────────────────────────────────

export class GorgiasService {
  private baseUrl: string;
  private authHeader: string;

  constructor(domain: string, email: string, apiKey: string) {
    this.baseUrl = `https://${domain}.gorgias.com/api`;
    this.authHeader = `Basic ${Buffer.from(`${email}:${apiKey}`).toString("base64")}`;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gorgias API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<{ account: string; domain: string }> {
    const data = await this.request<GorgiasAccount>("/account");
    return { account: data.name, domain: data.domain };
  }

  // ── Tickets ──

  async listTickets(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ tickets: GorgiasTicket[]; meta?: GorgiasPaginatedResponse<GorgiasTicket>["meta"] }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("per_page", String(params.limit));
    if (params?.status) qs.set("status", params.status);
    const query = qs.toString();
    const data = await this.request<GorgiasPaginatedResponse<GorgiasTicket>>(
      `/tickets${query ? `?${query}` : ""}`
    );
    return { tickets: data.data || [], meta: data.meta };
  }

  async getTicket(id: number): Promise<GorgiasTicket> {
    return this.request<GorgiasTicket>(`/tickets/${id}`);
  }

  async getTicketMessages(ticketId: number): Promise<GorgiasMessage[]> {
    const data = await this.request<GorgiasPaginatedResponse<GorgiasMessage>>(
      `/tickets/${ticketId}/messages`
    );
    return data.data || [];
  }

  // ── Customers ──

  async listCustomers(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ customers: GorgiasCustomer[]; meta?: GorgiasPaginatedResponse<GorgiasCustomer>["meta"] }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("per_page", String(params.limit));
    const query = qs.toString();
    const data = await this.request<GorgiasPaginatedResponse<GorgiasCustomer>>(
      `/customers${query ? `?${query}` : ""}`
    );
    return { customers: data.data || [], meta: data.meta };
  }

  async getCustomer(id: number): Promise<GorgiasCustomer> {
    return this.request<GorgiasCustomer>(`/customers/${id}`);
  }

  // ── Tags ──

  async listTags(): Promise<GorgiasTag[]> {
    const data = await this.request<GorgiasPaginatedResponse<GorgiasTag>>("/tags");
    return data.data || [];
  }

  // ── Views ──

  async listViews(): Promise<GorgiasView[]> {
    const data = await this.request<GorgiasPaginatedResponse<GorgiasView>>("/views");
    return data.data || [];
  }

  // ── Channels ──

  async listChannels(): Promise<GorgiasChannel[]> {
    const data = await this.request<GorgiasPaginatedResponse<GorgiasChannel>>("/channels");
    return data.data || [];
  }

  // ── Teams ──

  async listTeams(): Promise<GorgiasTeam[]> {
    const data = await this.request<GorgiasPaginatedResponse<GorgiasTeam>>("/teams");
    return data.data || [];
  }

  // ── Macros ──

  async listMacros(): Promise<GorgiasMacro[]> {
    const data = await this.request<GorgiasPaginatedResponse<GorgiasMacro>>("/macros");
    return data.data || [];
  }

  // ── Rules ──

  async listRules(): Promise<GorgiasRule[]> {
    const data = await this.request<GorgiasPaginatedResponse<GorgiasRule>>("/rules");
    return data.data || [];
  }

  // ── Satisfaction Surveys ──

  async listSatisfactionSurveys(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ surveys: GorgiasSatisfactionSurvey[]; meta?: GorgiasPaginatedResponse<GorgiasSatisfactionSurvey>["meta"] }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("per_page", String(params.limit));
    const query = qs.toString();
    const data = await this.request<GorgiasPaginatedResponse<GorgiasSatisfactionSurvey>>(
      `/satisfaction-surveys${query ? `?${query}` : ""}`
    );
    return { surveys: data.data || [], meta: data.meta };
  }

  // ── Statistics ──

  async getStatistics(params: { from: string; to: string }): Promise<GorgiasStatistics> {
    const qs = new URLSearchParams();
    qs.set("from", params.from);
    qs.set("to", params.to);
    return this.request<GorgiasStatistics>(`/stats?${qs.toString()}`);
  }

  // ── Webhooks ──

  async listWebhooks(): Promise<GorgiasWebhook[]> {
    const data = await this.request<GorgiasPaginatedResponse<GorgiasWebhook>>("/webhooks");
    return data.data || [];
  }

  async createWebhook(url: string, eventType: string): Promise<GorgiasWebhook> {
    return this.request<GorgiasWebhook>("/webhooks", {
      method: "POST",
      body: JSON.stringify({ url, event_type: eventType }),
    });
  }

  async deleteWebhook(id: number): Promise<void> {
    await this.request(`/webhooks/${id}`, { method: "DELETE" });
  }
}
