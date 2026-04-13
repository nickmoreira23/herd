/**
 * Video generation tool using Runway or HeyGen.
 * Generates short videos from text/image prompts.
 */

import Anthropic from "@anthropic-ai/sdk";
import { getVideoService } from "@/lib/foundation/video";
import type { SendFn } from "../runtime";

// ─── Tool Definition ───────────────────────────────────────────

export const VIDEO_GENERATION_TOOL: Anthropic.Tool = {
  name: "generate_video",
  description:
    "Generate a short video from a text prompt or image. Returns a video URL. Use when the user asks to create, animate, or produce video content. Note: video generation can take several minutes.",
  input_schema: {
    type: "object" as const,
    properties: {
      prompt: {
        type: "string",
        description:
          "Description of the video to generate. Include motion, style, and scene details.",
      },
      image_url: {
        type: "string",
        description:
          "Optional: URL of an image to animate or use as the first frame.",
      },
      duration: {
        type: "number",
        enum: [5, 10],
        description: "Video duration in seconds. Defaults to 5.",
      },
    },
    required: ["prompt"],
  },
};

// ─── Tool Handler ──────────────────────────────────────────────

export async function handleVideoGeneration(
  input: Record<string, unknown>,
  send: SendFn
): Promise<string> {
  const prompt = input.prompt as string;

  if (!prompt) return "Error: No prompt provided.";

  send("step", { text: "Starting video generation (this may take a few minutes)..." });

  try {
    const videoService = getVideoService();
    const result = await videoService.generate({
      prompt,
      imageUrl: input.image_url as string | undefined,
      duration: (input.duration as number) || 5,
    });

    send("step_complete", { text: "Video generated" });
    send("media_output", {
      type: "video",
      url: result.videoUrl,
      mimeType: "video/mp4",
    });

    return `Video generated successfully. The video player is shown above. URL: ${result.videoUrl}`;
  } catch (err) {
    return `Video generation error: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}
