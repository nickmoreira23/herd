const BASE_URL = "https://api.pinterest.com/v5";

// ─── Pinterest API Types ─────────────────────────────────────────

export interface PinterestUser {
  username: string;
  account_type: string;
  profile_image: string;
  website_url?: string;
  follower_count: number;
  following_count: number;
  pin_count: number;
  board_count: number;
  monthly_views: number;
}

export interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  pin_count: number;
  follower_count: number;
  privacy: string;
  created_at: string;
}

export interface PinterestPin {
  id: string;
  title?: string;
  description?: string;
  link?: string;
  created_at: string;
  media?: { media_type: string };
  board_id: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class PinterestService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Pinterest API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<PinterestUser> {
    return this.request<PinterestUser>(
      "/user_account"
    );
  }

  // ── Profile ──

  async getProfile(): Promise<PinterestUser> {
    return this.request<PinterestUser>("/user_account");
  }

  // ── Boards ──

  async listBoards(): Promise<PinterestBoard[]> {
    const data = await this.request<{ items: PinterestBoard[] }>("/boards");
    return data.items || [];
  }

  // ── Pins ──

  async listPins(boardId?: string): Promise<PinterestPin[]> {
    const path = boardId
      ? `/boards/${boardId}/pins`
      : "/pins";
    const data = await this.request<{ items: PinterestPin[] }>(path);
    return data.items || [];
  }

  // ── Stats ──

  async getStats(): Promise<{
    username: string;
    followers: number;
    following: number;
    pinCount: number;
    boardCount: number;
    monthlyViews: number;
  }> {
    const profile = await this.getProfile();
    return {
      username: profile.username,
      followers: profile.follower_count || 0,
      following: profile.following_count || 0,
      pinCount: profile.pin_count || 0,
      boardCount: profile.board_count || 0,
      monthlyViews: profile.monthly_views || 0,
    };
  }
}
