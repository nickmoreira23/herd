const GRAPH_URL = "https://graph.instagram.com";

// ─── Instagram API Types ──────────────────────────────────────────

export interface InstagramUser {
  id: string;
  username: string;
  name?: string;
  account_type: string;
  media_count: number;
  followers_count?: number;
  follows_count?: number;
  biography?: string;
  profile_picture_url?: string;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

export interface InstagramInsight {
  name: string;
  period: string;
  values: Array<{ value: number; end_time?: string }>;
  title: string;
  description: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class InstagramService {
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
      throw new Error(`Instagram API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<InstagramUser> {
    return this.request<InstagramUser>(
      "/me?fields=id,username,name,account_type,media_count"
    );
  }

  // ── Profile ──

  async getProfile(): Promise<InstagramUser> {
    return this.request<InstagramUser>(
      "/me?fields=id,username,name,account_type,media_count,followers_count,follows_count,biography,profile_picture_url"
    );
  }

  // ── Media ──

  async listMedia(limit = 25): Promise<InstagramMedia[]> {
    const data = await this.request<{ data: InstagramMedia[] }>(
      `/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}`
    );
    return data.data;
  }

  // ── Stats ──

  async getStats(): Promise<{
    username: string;
    mediaCount: number;
    followersCount: number;
    followsCount: number;
    recentPosts: number;
  }> {
    const profile = await this.getProfile();
    let recentPosts = 0;
    try {
      const media = await this.listMedia(5);
      recentPosts = media.length;
    } catch {
      // Media may not be accessible
    }

    return {
      username: profile.username,
      mediaCount: profile.media_count || 0,
      followersCount: profile.followers_count || 0,
      followsCount: profile.follows_count || 0,
      recentPosts,
    };
  }
}
