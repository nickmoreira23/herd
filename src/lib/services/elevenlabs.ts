const BASE_URL = "https://api.elevenlabs.io/v1";

// ─── ElevenLabs API Types ───────────────────────────────────────

export interface ElevenLabsUser {
  subscription: {
    tier: string;
    character_count: number;
    character_limit: number;
    status: string;
  };
  xi_api_key?: string;
  first_name?: string;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url?: string;
  description?: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class ElevenLabsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        "xi-api-key": this.apiKey,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`ElevenLabs API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<ElevenLabsUser> {
    return this.request<ElevenLabsUser>("/user");
  }

  // ── Voices ──

  async listVoices(): Promise<ElevenLabsVoice[]> {
    const data = await this.request<{ voices: ElevenLabsVoice[] }>("/voices");
    return data.voices;
  }

  async getVoice(voiceId: string): Promise<ElevenLabsVoice> {
    return this.request<ElevenLabsVoice>(`/voices/${voiceId}`);
  }

  // ── Stats ──

  async getStats(): Promise<{
    tier: string;
    characterCount: number;
    characterLimit: number;
    status: string;
    voiceCount: number;
  }> {
    const user = await this.testConnection();
    let voiceCount = 0;
    try {
      const voices = await this.listVoices();
      voiceCount = voices.length;
    } catch {
      // Voices may not be accessible
    }

    return {
      tier: user.subscription.tier,
      characterCount: user.subscription.character_count,
      characterLimit: user.subscription.character_limit,
      status: user.subscription.status,
      voiceCount,
    };
  }
}
