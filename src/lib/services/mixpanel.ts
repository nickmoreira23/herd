const BASE_URL = "https://mixpanel.com/api";
const DATA_URL = "https://data.mixpanel.com/api/2.0";
const EU_BASE_URL = "https://eu.mixpanel.com/api";

// ─── Mixpanel API Types ──────────────────────────────────────────

export interface MixpanelProject {
  id: number;
  name: string;
  created: string;
  status: string;
  token: string;
}

export interface MixpanelEventCount {
  event: string;
  count: number;
}

export interface MixpanelTopEvents {
  events: Record<string, { count: number }>;
  type: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class MixpanelService {
  private serviceAccountUser: string;
  private serviceAccountSecret: string;
  private projectId: string;

  constructor(serviceAccountUser: string, serviceAccountSecret: string, projectId: string) {
    this.serviceAccountUser = serviceAccountUser;
    this.serviceAccountSecret = serviceAccountSecret;
    this.projectId = projectId;
  }

  private get authHeader(): string {
    return `Basic ${Buffer.from(`${this.serviceAccountUser}:${this.serviceAccountSecret}`).toString("base64")}`;
  }

  private async request<T>(
    path: string,
    options?: RequestInit & { useDataUrl?: boolean }
  ): Promise<T> {
    const baseUrl = options?.useDataUrl ? DATA_URL : `${BASE_URL}/app/me`;
    const url = path.startsWith("http") ? path : `${baseUrl}${path}`;

    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Mixpanel API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<Record<string, unknown>> {
    // Use the query API to validate credentials
    const res = await fetch(
      `https://mixpanel.com/api/2.0/events/top?project_id=${this.projectId}&limit=1`,
      {
        headers: {
          Authorization: this.authHeader,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Mixpanel connection test failed ${res.status}: ${body}`);
    }

    return res.json() as Promise<Record<string, unknown>>;
  }

  // ── Events ──

  async getTopEvents(limit = 10): Promise<string[]> {
    const res = await fetch(
      `https://mixpanel.com/api/2.0/events/top?project_id=${this.projectId}&limit=${limit}`,
      {
        headers: {
          Authorization: this.authHeader,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) return [];

    const data = (await res.json()) as Record<string, unknown>;
    if (Array.isArray(data)) {
      return data.map((e: Record<string, unknown>) => String(e.event || ""));
    }
    return Object.keys(data);
  }

  // ── Stats ──

  async getStats(): Promise<{
    topEvents: string[];
    projectId: string;
  }> {
    const topEvents = await this.getTopEvents(10);
    return { topEvents, projectId: this.projectId };
  }
}
