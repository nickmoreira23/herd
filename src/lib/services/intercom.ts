const BASE_URL = "https://api.intercom.io";
const API_VERSION = "2.11";

// ─── Intercom API Types ────────────────────────────────────────────

export interface IntercomAdmin {
  id: string;
  type: string;
  name: string;
  email: string;
  job_title: string | null;
  away_mode_enabled: boolean;
  away_mode_reassign: boolean;
  has_inbox_seat: boolean;
  team_ids: number[];
  avatar: { image_url: string | null } | null;
}

export interface IntercomTeam {
  id: string;
  name: string;
  admin_ids: number[];
}

export interface IntercomTag {
  id: string;
  name: string;
}

export interface IntercomSegment {
  id: string;
  name: string;
  type: string;
  created_at: number;
  updated_at: number;
  person_type: string;
  count: number | null;
}

export interface IntercomConversationPart {
  id: string;
  part_type: string;
  body: string | null;
  created_at: number;
  updated_at: number;
  author: {
    type: string;
    id: string;
    name: string | null;
    email: string | null;
  };
}

export interface IntercomConversation {
  id: string;
  type: string;
  title: string | null;
  created_at: number;
  updated_at: number;
  state: string;
  open: boolean;
  read: boolean;
  priority: string;
  admin_assignee_id: number | null;
  team_assignee_id: number | null;
  tags: { type: string; tags: IntercomTag[] };
  source: {
    type: string;
    id: string;
    delivered_as: string;
    subject: string | null;
    body: string | null;
    author: {
      type: string;
      id: string;
      name: string | null;
      email: string | null;
    };
    url: string | null;
  };
  contacts: {
    type: string;
    contacts: { id: string; type: string }[];
  };
  conversation_parts?: {
    type: string;
    conversation_parts: IntercomConversationPart[];
    total_count: number;
  };
  statistics?: {
    type: string;
    time_to_assignment: number | null;
    time_to_admin_reply: number | null;
    time_to_first_close: number | null;
    time_to_last_close: number | null;
    median_time_to_reply: number | null;
    first_contact_reply_at: number | null;
    first_assignment_at: number | null;
    first_admin_reply_at: number | null;
    first_close_at: number | null;
    last_assignment_at: number | null;
    last_assignment_admin_reply_at: number | null;
    last_contact_reply_at: number | null;
    last_admin_reply_at: number | null;
    last_close_at: number | null;
    last_closed_by_id: string | null;
    count_reopens: number;
    count_assignments: number;
    count_conversation_parts: number;
  };
}

export interface IntercomContact {
  id: string;
  type: string;
  role: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  avatar: string | null;
  owner_id: number | null;
  created_at: number;
  updated_at: number;
  signed_up_at: number | null;
  last_seen_at: number | null;
  last_replied_at: number | null;
  last_contacted_at: number | null;
  last_email_opened_at: number | null;
  last_email_clicked_at: number | null;
  browser: string | null;
  browser_language: string | null;
  os: string | null;
  location: {
    type: string;
    country: string | null;
    region: string | null;
    city: string | null;
  } | null;
  unsubscribed_from_emails: boolean;
  tags: { type: string; tags: IntercomTag[] };
  custom_attributes: Record<string, unknown>;
}

export interface IntercomDataAttribute {
  id: number;
  name: string;
  full_name: string;
  label: string;
  description: string;
  data_type: string;
  model: string;
  api_writable: boolean;
  custom: boolean;
  archived: boolean;
}

export interface IntercomHelpCollection {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
  order: number;
  icon: string | null;
}

export interface IntercomHelpArticle {
  id: string;
  type: string;
  workspace_id: string;
  title: string;
  description: string | null;
  body: string;
  author_id: number;
  state: string;
  created_at: number;
  updated_at: number;
  url: string | null;
  parent_id: string | null;
  parent_type: string | null;
}

export interface IntercomCounts {
  type: string;
  company: { count: number };
  user: { count: number };
  lead: { count: number };
  tag: { count: number };
  segment: { count: number };
  conversation: {
    open: number;
    closed: number;
    unassigned: number;
    assigned: number;
  };
}

interface PaginatedResponse<T> {
  type: string;
  data: T[];
  total_count: number;
  pages?: {
    type: string;
    next?: { page: number; starting_after: string } | null;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

// ─── Service Class ──────────────────────────────────────────────────

export class IntercomService {
  private token: string;

  constructor(accessToken: string) {
    this.token = accessToken;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Intercom-Version": API_VERSION,
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Intercom API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<{ appName: string; adminName: string }> {
    const data = await this.request<IntercomAdmin & { app: { name: string } }>("/me");
    return { appName: data.app?.name || "Intercom", adminName: data.name || data.email };
  }

  // ── Conversations ──

  async listConversations(params?: {
    startingAfter?: string;
    perPage?: number;
  }): Promise<{ conversations: IntercomConversation[]; nextCursor?: string }> {
    const qs = new URLSearchParams();
    if (params?.startingAfter) qs.set("starting_after", params.startingAfter);
    if (params?.perPage) qs.set("per_page", String(params.perPage));
    const query = qs.toString();
    const data = await this.request<PaginatedResponse<IntercomConversation>>(
      `/conversations${query ? `?${query}` : ""}`
    );
    return {
      conversations: data.data || [],
      nextCursor: data.pages?.next?.starting_after || undefined,
    };
  }

  async getConversation(id: string): Promise<IntercomConversation> {
    return this.request<IntercomConversation>(`/conversations/${id}?display_as=plaintext`);
  }

  // ── Contacts ──

  async listContacts(params?: {
    startingAfter?: string;
    perPage?: number;
  }): Promise<{ contacts: IntercomContact[]; nextCursor?: string }> {
    const qs = new URLSearchParams();
    if (params?.startingAfter) qs.set("starting_after", params.startingAfter);
    if (params?.perPage) qs.set("per_page", String(params.perPage));
    const query = qs.toString();
    const data = await this.request<PaginatedResponse<IntercomContact>>(
      `/contacts${query ? `?${query}` : ""}`
    );
    return {
      contacts: data.data || [],
      nextCursor: data.pages?.next?.starting_after || undefined,
    };
  }

  async getContact(id: string): Promise<IntercomContact> {
    return this.request<IntercomContact>(`/contacts/${id}`);
  }

  async searchContacts(query: {
    field: string;
    operator: string;
    value: string;
  }): Promise<{ contacts: IntercomContact[]; nextCursor?: string }> {
    const data = await this.request<PaginatedResponse<IntercomContact>>("/contacts/search", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
    return {
      contacts: data.data || [],
      nextCursor: data.pages?.next?.starting_after || undefined,
    };
  }

  // ── Admins ──

  async listAdmins(): Promise<IntercomAdmin[]> {
    const data = await this.request<{ type: string; admins: IntercomAdmin[] }>("/admins");
    return data.admins || [];
  }

  // ── Teams ──

  async listTeams(): Promise<IntercomTeam[]> {
    const data = await this.request<{ type: string; teams: IntercomTeam[] }>("/teams");
    return data.teams || [];
  }

  // ── Tags ──

  async listTags(): Promise<IntercomTag[]> {
    const data = await this.request<{ type: string; data: IntercomTag[] }>("/tags");
    return data.data || [];
  }

  // ── Segments ──

  async listSegments(): Promise<IntercomSegment[]> {
    const data = await this.request<{ type: string; segments: IntercomSegment[] }>("/segments");
    return data.segments || [];
  }

  // ── Data Attributes ──

  async listDataAttributes(model?: "contact" | "company" | "conversation"): Promise<IntercomDataAttribute[]> {
    const qs = model ? `?model=${model}` : "";
    const data = await this.request<{ type: string; data: IntercomDataAttribute[] }>(
      `/data_attributes${qs}`
    );
    return data.data || [];
  }

  // ── Help Center ──

  async listHelpCenterCollections(): Promise<IntercomHelpCollection[]> {
    const data = await this.request<PaginatedResponse<IntercomHelpCollection>>(
      "/help_center/collections"
    );
    return data.data || [];
  }

  async listHelpCenterArticles(params?: {
    startingAfter?: string;
    perPage?: number;
  }): Promise<{ articles: IntercomHelpArticle[]; nextCursor?: string }> {
    const qs = new URLSearchParams();
    if (params?.startingAfter) qs.set("starting_after", params.startingAfter);
    if (params?.perPage) qs.set("per_page", String(params.perPage));
    const query = qs.toString();
    const data = await this.request<PaginatedResponse<IntercomHelpArticle>>(
      `/articles${query ? `?${query}` : ""}`
    );
    return {
      articles: data.data || [],
      nextCursor: data.pages?.next?.starting_after || undefined,
    };
  }

  // ── Statistics / Counts ──

  async getCounts(): Promise<IntercomCounts> {
    return this.request<IntercomCounts>("/counts?type=conversation");
  }
}
