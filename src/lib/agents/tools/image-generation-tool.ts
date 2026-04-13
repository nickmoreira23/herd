/**
 * Image generation tool using Replicate (Stable Diffusion / Flux).
 * Generates images from text prompts.
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getIntegrationApiKey } from "@/lib/integrations";
import type { SendFn } from "../runtime";

// ─── Tool Definition ───────────────────────────────────────────

export const IMAGE_GENERATION_TOOL: Anthropic.Tool = {
  name: "generate_image",
  description:
    "Generate an image from a text prompt using AI. Returns the image URL. Use when the user asks you to create, draw, design, or visualize something as an image.",
  input_schema: {
    type: "object" as const,
    properties: {
      prompt: {
        type: "string",
        description:
          "Detailed description of the image to generate. Be specific about style, composition, lighting, colors.",
      },
      aspect_ratio: {
        type: "string",
        enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
        description: "Image aspect ratio. Defaults to 1:1.",
      },
    },
    required: ["prompt"],
  },
};

// ─── Tool Handler ──────────────────────────────────────────────

export async function handleImageGeneration(
  input: Record<string, unknown>,
  send: SendFn
): Promise<string> {
  const prompt = input.prompt as string;
  const aspectRatio = (input.aspect_ratio as string) || "1:1";

  if (!prompt) return "Error: No prompt provided.";

  const apiKey = await getIntegrationApiKey("replicate");
  if (!apiKey) {
    return "Replicate is not connected. Please connect it in Settings > Integrations to enable image generation.";
  }

  send("step", { text: "Generating image..." });

  try {
    // Use Flux Schnell for fast generation
    const res = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "black-forest-labs/flux-schnell",
        input: {
          prompt,
          aspect_ratio: aspectRatio,
          num_outputs: 1,
          output_format: "webp",
          output_quality: 90,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return `Replicate error (${res.status}): ${errText.slice(0, 200)}`;
    }

    const prediction = await res.json();
    let resultUrl: string | null = null;

    // Poll for completion
    if (prediction.status === "succeeded" && prediction.output?.[0]) {
      resultUrl = prediction.output[0];
    } else if (prediction.urls?.get) {
      // Poll until complete
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const poll = await fetch(prediction.urls.get, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const status = await poll.json();

        if (status.status === "succeeded" && status.output?.[0]) {
          resultUrl = status.output[0];
          break;
        } else if (status.status === "failed") {
          return `Image generation failed: ${status.error || "Unknown error"}`;
        }
      }
    }

    if (!resultUrl) {
      return "Image generation timed out. Please try again.";
    }

    // Download and save locally
    const imgRes = await fetch(resultUrl);
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const fileName = `gen_${Date.now()}.webp`;
    const outputDir = path.join(process.cwd(), "public/uploads/chat/images");
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, fileName), imgBuffer);

    const imageUrl = `/uploads/chat/images/${fileName}`;

    send("step_complete", { text: "Image generated" });
    send("media_output", {
      type: "image",
      url: imageUrl,
      mimeType: "image/webp",
      fileName,
    });

    return `Image generated successfully. The image is displayed above. URL: ${imageUrl}`;
  } catch (err) {
    return `Image generation error: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}
