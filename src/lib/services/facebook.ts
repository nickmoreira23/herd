const GRAPH_URL = "https://graph.facebook.com/v19.0";

// ─── Facebook API Types ──────────────────────────────────────────

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  fan_count?: number;
  followers_count?: number;
  access_token?: string;
}

export interface FacebookUser {
  id: string;
  name: string;
  email?: string;
}

export interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  type: string;
  permalink_url?: string;
  likes?: { summary: { total_count: number } };
  comments?: { summary: { total_count: number } };
  shares?: { count: number };
}

export interface FacebookPageInsight {
  name: string;
  period: string;
  values: Array<{ value: number | Record<string, number>; end_time: string }>;
}

// ─── Service Class ────────────────────────────────────────────────

export class FacebookService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(path: string): Promise<T> {
    const separator = path.includes("?") ? "&" : "?";
    const url = `${GRAPH_URL}${path}${separator}access_token=${this.token}`;

    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Facebook API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<FacebookUser> {
    return this.request<FacebookUser>("/me?fields=id,name,email");
  }

  // ── Pages ──

  async listPages(): Promise<FacebookPage[]> {
    const data = await this.request<{ data: FacebookPage[] }>(
      "/me/accounts?fields=id,name,category,fan_count,followers_count,access_token"
    );
    return data.data;
  }

  // ── Page Posts ──

  async listPagePosts(pageId: string, limit = 25): Promise<FacebookPost[]> {
    const data = await this.request<{ data: FacebookPost[] }>(
      `/${pageId}/posts?fields=id,message,created_time,type,permalink_url&limit=${limit}`
    );
    return data.data;
  }

  // ── Stats ──

  async getStats(): Promise<{
    userName: string;
    pages: Array<{ id: string; name: string; category: string; fans: number; followers: number }>;
    totalPages: number;
  }> {
    const user = await this.testConnection();
    let pages: FacebookPage[] = [];
    try {
      pages = await this.listPages();
    } catch {
      // Pages may not be accessible
    }

    return {
      userName: user.name,
      pages: pages.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        fans: p.fan_count || 0,
        followers: p.followers_count || 0,
      })),
      totalPages: pages.length,
    };
  }
}
