/**
 * Vision analysis tool using Claude Vision API.
 * Analyzes images in detail — useful for agents that need to inspect visuals.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { SendFn } from "../runtime";

// ─── Tool Definition ───────────────────────────────────────────

export const VISION_TOOL: Anthropic.Tool = {
  name: "analyze_image",
  description:
    "Analyze an image in detail using Claude Vision. Describe what you see, extract text, identify objects, read charts/tables, etc. Use when you need to understand the contents of an image that was uploaded to the conversation.",
  input_schema: {
    type: "object" as const,
    properties: {
      image_url: {
        type: "string",
        description: "URL of the image to analyze.",
      },
      question: {
        type: "string",
        description:
          "Specific question about the image. If omitted, provides a general description.",
      },
    },
    required: ["image_url"],
  },
};

// ─── Tool Handler ──────────────────────────────────────────────

export async function handleVision(
  input: Record<string, unknown>,
  anthropic: Anthropic,
  send: SendFn
): Promise<string> {
  const imageUrl = input.image_url as string;
  const question = (input.question as string) || "Describe this image in detail.";

  if (!imageUrl) return "Error: No image URL provided.";

  send("step", { text: "Analyzing image..." });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            {
              type: "text",
              text: question,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const analysis = textBlock && textBlock.type === "text" ? textBlock.text : "No analysis generated.";

    send("step_complete", { text: "Image analyzed" });

    return analysis;
  } catch (err) {
    return `Vision analysis error: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}
