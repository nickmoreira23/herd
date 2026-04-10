const BASE_URL = "https://www.googleapis.com/youtube/v3";

// ─── YouTube API Types ───────────────────────────────────────────

export interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    thumbnails: Record<string, { url: string; width: number; height: number }>;
    publishedAt: string;
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    videoCount: string;
    hiddenSubscriberCount: boolean;
  };
  contentDetails?: {
    relatedPlaylists: {
      uploads: string;
    };
  };
}

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: Record<string, { url: string }>;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

// ─── Service Class ────────────────────────────────────────────────

export class YouTubeService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(path: string): Promise<T> {
    const separator = path.includes("?") ? "&" : "?";
    const res = await fetch(`${BASE_URL}${path}${separator}access_token=${this.token}`);

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`YouTube API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<YouTubeChannel> {
    const data = await this.request<{ items: YouTubeChannel[] }>(
      "/channels?part=snippet,statistics&mine=true"
    );
    if (!data.items?.length) {
      throw new Error("No YouTube channel found for this account");
    }
    return data.items[0];
  }

  // ── Channel ──

  async getChannel(): Promise<YouTubeChannel> {
    const data = await this.request<{ items: YouTubeChannel[] }>(
      "/channels?part=snippet,statistics,contentDetails&mine=true"
    );
    if (!data.items?.length) throw new Error("No channel found");
    return data.items[0];
  }

  // ── Videos ──

  async listVideos(maxResults = 10): Promise<YouTubeVideo[]> {
    const channel = await this.getChannel();
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) return [];

    const playlistItems = await this.request<{
      items: Array<{ snippet: { resourceId: { videoId: string } } }>;
    }>(
      `/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}`
    );

    const videoIds = playlistItems.items
      .map((i) => i.snippet.resourceId.videoId)
      .join(",");

    if (!videoIds) return [];

    const videos = await this.request<{ items: YouTubeVideo[] }>(
      `/videos?part=snippet,statistics&id=${videoIds}`
    );

    return videos.items;
  }

  // ── Stats ──

  async getStats(): Promise<{
    channelName: string;
    subscribers: number;
    totalViews: number;
    videoCount: number;
  }> {
    const channel = await this.getChannel();
    return {
      channelName: channel.snippet.title,
      subscribers: parseInt(channel.statistics.subscriberCount) || 0,
      totalViews: parseInt(channel.statistics.viewCount) || 0,
      videoCount: parseInt(channel.statistics.videoCount) || 0,
    };
  }
}
