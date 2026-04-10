const BASE_URL = "https://api.x.com/2";

// ─── X (Twitter) API Types ───────────────────────────────────────

export interface XUser {
  id: string;
  name: string;
  username: string;
  description?: string;
  profile_image_url?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  created_at?: string;
  verified?: boolean;
}

export interface XTweet {
  id: string;
  text: string;
  created_at?: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count: number;
  };
  author_id?: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class XTwitterService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`X API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<XUser> {
    const data = await this.request<{ data: XUser }>(
      "/users/me?user.fields=name,username,description,profile_image_url,public_metrics,created_at"
    );
    return data.data;
  }

  // ── User ──

  async getMe(): Promise<XUser> {
    const data = await this.request<{ data: XUser }>(
      "/users/me?user.fields=name,username,description,profile_image_url,public_metrics,created_at,verified"
    );
    return data.data;
  }

  // ── Tweets ──

  async listRecentTweets(userId: string, maxResults = 10): Promise<XTweet[]> {
    const data = await this.request<{ data?: XTweet[] }>(
      `/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics,author_id`
    );
    return data.data || [];
  }

  // ── Stats ──

  async getStats(): Promise<{
    username: string;
    name: string;
    followers: number;
    following: number;
    tweetCount: number;
  }> {
    const user = await this.getMe();
    return {
      username: user.username,
      name: user.name,
      followers: user.public_metrics?.followers_count || 0,
      following: user.public_metrics?.following_count || 0,
      tweetCount: user.public_metrics?.tweet_count || 0,
    };
  }
}
