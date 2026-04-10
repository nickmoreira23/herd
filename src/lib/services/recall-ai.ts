import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

interface RecallBotConfig {
  meeting_url: string;
  bot_name?: string;
  join_at?: string; // ISO datetime
  automatic_leave?: {
    waiting_room_timeout?: number;
    noone_joined_timeout?: number;
    everyone_left_timeout?: number;
  };
  recording_mode?: "speaker_view" | "gallery_view" | "audio_only";
  transcription?: { provider: "default" } | null;
}

interface RecallBot {
  id: string;
  meeting_url: string;
  status_changes: Array<{ code: string; created_at: string }>;
  video_url: string | null;
  audio_url: string | null;
  transcript: Array<{
    speaker: string;
    words: Array<{ text: string; start_time: number; end_time: number }>;
  }> | null;
}

interface RecallBotListResponse {
  count: number;
  next: string | null;
  results: RecallBot[];
}

export class RecallAiService {
  private apiKey: string;
  private baseUrl = "https://us-west-2.recall.ai/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Build a RecallAiService from the stored integration credentials.
   * Returns null if the integration is not configured.
   */
  static async fromIntegration(): Promise<RecallAiService | null> {
    const integration = await prisma.integration.findUnique({
      where: { slug: "recall-ai" },
    });
    if (!integration?.credentials) return null;
    try {
      const creds = JSON.parse(decrypt(integration.credentials));
      return new RecallAiService(creds.apiKey);
    } catch {
      return null;
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Token ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Recall.ai API error ${res.status}: ${body}`);
    }
    return res.json();
  }

  /** Create a new recording bot and send it to a meeting URL. */
  async createBot(config: RecallBotConfig): Promise<RecallBot> {
    return this.request<RecallBot>("/bot", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  /** Retrieve a bot by its ID. */
  async getBot(botId: string): Promise<RecallBot> {
    return this.request<RecallBot>(`/bot/${botId}`);
  }

  /** List bots, optionally filtered by meeting URL. */
  async listBots(params?: {
    meeting_url?: string;
  }): Promise<RecallBotListResponse> {
    const search = new URLSearchParams();
    if (params?.meeting_url) search.set("meeting_url", params.meeting_url);
    const qs = search.toString();
    return this.request<RecallBotListResponse>(
      `/bot${qs ? `?${qs}` : ""}`
    );
  }

  /** Delete (cancel) a bot. */
  async deleteBot(botId: string): Promise<void> {
    await fetch(`${this.baseUrl}/bot/${botId}`, {
      method: "DELETE",
      headers: { Authorization: `Token ${this.apiKey}` },
    });
  }

  /** Retrieve the transcript produced by a bot. */
  async getBotTranscript(
    botId: string
  ): Promise<RecallBot["transcript"]> {
    return this.request<RecallBot["transcript"]>(
      `/bot/${botId}/transcript`
    );
  }

  /** Verify that the API key can reach Recall.ai. */
  async testConnection(): Promise<boolean> {
    try {
      await this.listBots();
      return true;
    } catch {
      return false;
    }
  }
}
