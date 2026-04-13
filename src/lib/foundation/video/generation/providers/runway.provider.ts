import { getIntegrationApiKey } from "@/lib/integrations";
import type {
  VideoGenerationProvider,
  VideoGenerationInput,
  VideoGenerationResult,
} from "../../types";

// ─── Runway Video Generation Provider ───────────────────────────

export class RunwayGenerationProvider implements VideoGenerationProvider {
  name = "Runway";
  slug = "runway";

  async isAvailable(): Promise<boolean> {
    const key = await this.resolveApiKey();
    return !!key;
  }

  async generate(input: VideoGenerationInput): Promise<VideoGenerationResult> {
    const apiKey = await this.resolveApiKey();
    if (!apiKey) {
      throw new Error(
        "Runway API key not configured. Connect Runway in Settings → Integrations."
      );
    }

    // Create generation task via Runway Gen-3
    const res = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: "gen3a_turbo",
        promptText: input.prompt,
        ...(input.imageUrl ? { promptImage: input.imageUrl } : {}),
        duration: input.duration || 5,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Runway error (${res.status}): ${errText.slice(0, 200)}`);
    }

    const task = await res.json();
    const taskId = task.id;

    if (!taskId) {
      throw new Error("Runway error: No task ID returned");
    }

    // Poll for completion (up to 5 minutes)
    const videoUrl = await this.pollForCompletion(taskId, apiKey);

    return {
      videoUrl,
      duration: input.duration || 5,
      provider: this.slug,
      taskId,
    };
  }

  // ── Private ────────────────────────────────────────────────────

  private async resolveApiKey(): Promise<string | null> {
    const integrationKey = await getIntegrationApiKey("runway");
    if (integrationKey) return integrationKey;

    if (process.env.RUNWAY_API_KEY) return process.env.RUNWAY_API_KEY;

    return null;
  }

  private async pollForCompletion(
    taskId: string,
    apiKey: string
  ): Promise<string> {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      const poll = await fetch(
        `https://api.dev.runwayml.com/v1/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "X-Runway-Version": "2024-11-06",
          },
        }
      );
      const status = await poll.json();

      if (status.status === "SUCCEEDED" && status.output?.[0]) {
        return status.output[0];
      } else if (status.status === "FAILED") {
        throw new Error(
          `Video generation failed: ${status.failure || "Unknown error"}`
        );
      }
    }

    throw new Error(
      "Video generation timed out after 5 minutes. Please try again later."
    );
  }
}
