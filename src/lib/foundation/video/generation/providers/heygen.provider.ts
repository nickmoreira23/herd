import { getIntegrationApiKey } from "@/lib/integrations";
import type {
  VideoGenerationProvider,
  VideoGenerationInput,
  VideoGenerationResult,
} from "../../types";

// ─── HeyGen Video Generation Provider ───────────────────────────

export class HeyGenGenerationProvider implements VideoGenerationProvider {
  name = "HeyGen";
  slug = "heygen";

  async isAvailable(): Promise<boolean> {
    const key = await this.resolveApiKey();
    return !!key;
  }

  async generate(input: VideoGenerationInput): Promise<VideoGenerationResult> {
    const apiKey = await this.resolveApiKey();
    if (!apiKey) {
      throw new Error(
        "HeyGen API key not configured. Connect HeyGen in Settings → Integrations."
      );
    }

    if (!input.avatarId || !input.voiceId || !input.voiceText) {
      throw new Error(
        "HeyGen requires avatarId, voiceId, and voiceText for video generation."
      );
    }

    // Create video via HeyGen V2 API
    const res = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: "avatar",
              avatar_id: input.avatarId,
            },
            voice: {
              type: "text",
              input_text: input.voiceText,
              voice_id: input.voiceId,
            },
          },
        ],
        ...(input.aspectRatio ? { aspect_ratio: input.aspectRatio } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HeyGen API error ${res.status}: ${body}`);
    }

    const json = await res.json();
    if (json.code && json.code !== 100) {
      throw new Error(`HeyGen API error: ${json.message || "Unknown error"}`);
    }

    const videoId = json.data?.video_id;
    if (!videoId) {
      throw new Error("HeyGen error: No video_id returned");
    }

    // Poll for completion (up to 10 minutes for avatar videos)
    const videoUrl = await this.pollForCompletion(videoId, apiKey);

    return {
      videoUrl,
      provider: this.slug,
      taskId: videoId,
    };
  }

  // ── Private ────────────────────────────────────────────────────

  private async resolveApiKey(): Promise<string | null> {
    const integrationKey = await getIntegrationApiKey("heygen");
    if (integrationKey) return integrationKey;

    if (process.env.HEYGEN_API_KEY) return process.env.HEYGEN_API_KEY;

    return null;
  }

  private async pollForCompletion(
    videoId: string,
    apiKey: string
  ): Promise<string> {
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      const res = await fetch(
        `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
        {
          headers: { "X-Api-Key": apiKey },
        }
      );

      const json = await res.json();
      const data = json.data ?? json;

      if (data.status === "completed" && data.video_url) {
        return data.video_url;
      } else if (data.status === "failed") {
        throw new Error(
          `HeyGen video generation failed: ${data.error || "Unknown error"}`
        );
      }
    }

    throw new Error(
      "HeyGen video generation timed out after 10 minutes. Please try again later."
    );
  }
}
