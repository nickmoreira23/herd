import { getIntegrationApiKey } from "@/lib/integrations";
import type { TTSProvider, TTSInput, TTSResult, TTSVoice } from "../../types";

const BASE_URL = "https://api.elevenlabs.io/v1";

// ─── ElevenLabs TTS Provider ─────────────────────────────────────

export class ElevenLabsTTSProvider implements TTSProvider {
  name = "ElevenLabs";
  slug = "elevenlabs";

  async isAvailable(): Promise<boolean> {
    const key = await this.resolveApiKey();
    return !!key;
  }

  async synthesize(input: TTSInput): Promise<TTSResult> {
    const apiKey = await this.resolveApiKey();
    if (!apiKey) {
      throw new Error(
        "ElevenLabs API key not configured. Connect ElevenLabs in Settings → Integrations, or set ELEVENLABS_API_KEY."
      );
    }

    const voiceId = input.voiceId ?? "21m00Tcm4TlvDq8ikWAM"; // Default: Rachel
    const model = input.model ?? "eleven_multilingual_v2";
    const outputFormat = input.outputFormat ?? "mp3";

    const formatParam = outputFormat === "mp3" ? "mp3_44100_128" : "pcm_16000";

    const res = await fetch(
      `${BASE_URL}/text-to-speech/${voiceId}?output_format=${formatParam}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: input.text,
          model_id: model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: input.speed ?? 1.0,
          },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`ElevenLabs TTS error ${res.status}: ${body}`);
    }

    const audioBuffer = Buffer.from(await res.arrayBuffer());
    const mimeType =
      outputFormat === "wav"
        ? "audio/wav"
        : outputFormat === "ogg"
          ? "audio/ogg"
          : outputFormat === "pcm"
            ? "audio/pcm"
            : "audio/mpeg";

    return {
      audioBuffer,
      mimeType,
      provider: this.slug,
    };
  }

  async listVoices(): Promise<TTSVoice[]> {
    const apiKey = await this.resolveApiKey();
    if (!apiKey) return [];

    const res = await fetch(`${BASE_URL}/voices`, {
      headers: { "xi-api-key": apiKey },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as {
      voices: Array<{
        voice_id: string;
        name: string;
        labels?: Record<string, string>;
        preview_url?: string;
      }>;
    };

    return data.voices.map((v) => ({
      id: v.voice_id,
      name: v.name,
      language: v.labels?.language,
      gender: v.labels?.gender,
      previewUrl: v.preview_url,
      provider: this.slug,
    }));
  }

  // ── Private ────────────────────────────────────────────────────

  private async resolveApiKey(): Promise<string | null> {
    const integrationKey = await getIntegrationApiKey("elevenlabs");
    if (integrationKey) return integrationKey;
    if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
    return null;
  }
}
