const BASE_URL = "https://open.tiktokapis.com/v2";

// ─── TikTok API Types ────────────────────────────────────────────

export interface TikTokUser {
  open_id: string;
  union_id: string;
  display_name: string;
  avatar_url?: string;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
  bio_description?: string;
  is_verified?: boolean;
}

export interface TikTokVideo {
  id: string;
  title?: string;
  create_time: number;
  cover_image_url?: string;
  share_url?: string;
  duration: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
}

// ─── Service Class ────────────────────────────────────────────────

export class TikTokService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`TikTok API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<TikTokUser> {
    const data = await this.request<{ data: { user: TikTokUser } }>(
      "/user/info/?fields=open_id,union_id,display_name,avatar_url"
    );
    return data.data.user;
  }

  // ── Profile ──

  async getProfile(): Promise<TikTokUser> {
    const data = await this.request<{ data: { user: TikTokUser } }>(
      "/user/info/?fields=open_id,union_id,display_name,avatar_url,follower_count,following_count,likes_count,video_count,bio_description,is_verified"
    );
    return data.data.user;
  }

  // ── Videos ──

  async listVideos(maxCount = 20): Promise<TikTokVideo[]> {
    const data = await this.request<{
      data: { videos: TikTokVideo[] };
    }>("/video/list/", {
      method: "POST",
      body: JSON.stringify({
        max_count: maxCount,
        fields: [
          "id", "title", "create_time", "cover_image_url",
          "share_url", "duration", "like_count", "comment_count",
          "share_count", "view_count",
        ],
      }),
    });
    return data.data.videos || [];
  }

  // ── Stats ──

  async getStats(): Promise<{
    displayName: string;
    followers: number;
    following: number;
    likes: number;
    videoCount: number;
  }> {
    const profile = await this.getProfile();
    return {
      displayName: profile.display_name,
      followers: profile.follower_count || 0,
      following: profile.following_count || 0,
      likes: profile.likes_count || 0,
      videoCount: profile.video_count || 0,
    };
  }
}
