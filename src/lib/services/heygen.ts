const BASE_URL = "https://api.heygen.com";

// ─── HeyGen API Types ────────────────────────────────────────────

export interface HeyGenUser {
  user_id: string;
  email?: string;
  plan?: string;
}

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  gender?: string;
  preview_image_url?: string;
  preview_video_url?: string;
}

export interface HeyGenVoice {
  voice_id: string;
  language: string;
  gender: string;
  name: string;
  preview_audio: string;
  support_pause: boolean;
}

export interface HeyGenVideo {
  video_id: string;
  status: string;
  title?: string;
  duration?: number;
  thumbnail_url?: string;
  video_url?: string;
  created_at?: number;
}

export interface HeyGenTemplate {
  template_id: string;
  name: string;
  thumbnail_image_url?: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class HeyGenService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "X-Api-Key": this.apiKey,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HeyGen API error ${res.status}: ${body}`);
    }

    const json = await res.json();
    // HeyGen wraps responses in { code, data, message }
    if (json.code && json.code !== 100) {
      throw new Error(`HeyGen API error: ${json.message || "Unknown error"}`);
    }

    return (json.data ?? json) as T;
  }

  // ── Connection ──

  async testConnection(): Promise<HeyGenUser> {
    return this.request<HeyGenUser>("/v1/user/remaining_quota");
  }

  // ── Avatars ──

  async listAvatars(): Promise<HeyGenAvatar[]> {
    const data = await this.request<{ avatars: HeyGenAvatar[] }>("/v2/avatars");
    return data.avatars ?? [];
  }

  // ── Voices ──

  async listVoices(): Promise<HeyGenVoice[]> {
    const data = await this.request<{ voices: HeyGenVoice[] }>("/v2/voices");
    return data.voices ?? [];
  }

  // ── Videos ──

  async listVideos(limit = 25): Promise<HeyGenVideo[]> {
    const data = await this.request<{ videos: HeyGenVideo[] }>(
      `/v1/video.list?limit=${limit}`
    );
    return data.videos ?? [];
  }

  async getVideo(videoId: string): Promise<HeyGenVideo> {
    return this.request<HeyGenVideo>(
      `/v1/video_status.get?video_id=${videoId}`
    );
  }

  // ── Templates ──

  async listTemplates(): Promise<HeyGenTemplate[]> {
    const data = await this.request<{ templates: HeyGenTemplate[] }>(
      "/v2/templates"
    );
    return data.templates ?? [];
  }

  // ── Video Generation (V5 Avatar) ──

  async generateVideo(payload: {
    video_inputs: Array<{
      character?: {
        type: "avatar";
        avatar_id: string;
        avatar_style?: string;
      };
      voice?: {
        type: "text";
        input_text: string;
        voice_id: string;
        speed?: number;
      };
      background?: {
        type: "color" | "image";
        value: string;
      };
    }>;
    dimension?: { width: number; height: number };
    aspect_ratio?: string;
  }): Promise<{ video_id: string }> {
    return this.request<{ video_id: string }>("/v2/video/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // ── Stats ──

  async getStats(): Promise<{
    avatarCount: number;
    voiceCount: number;
    videoCount: number;
    templateCount: number;
  }> {
    let avatarCount = 0;
    let voiceCount = 0;
    let videoCount = 0;
    let templateCount = 0;

    try {
      const avatars = await this.listAvatars();
      avatarCount = avatars.length;
    } catch {
      // Avatars may not be accessible
    }

    try {
      const voices = await this.listVoices();
      voiceCount = voices.length;
    } catch {
      // Voices may not be accessible
    }

    try {
      const videos = await this.listVideos(100);
      videoCount = videos.length;
    } catch {
      // Videos may not be accessible
    }

    try {
      const templates = await this.listTemplates();
      templateCount = templates.length;
    } catch {
      // Templates may not be accessible
    }

    return {
      avatarCount,
      voiceCount,
      videoCount,
      templateCount,
    };
  }
}
