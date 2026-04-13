/**
 * Presentation generation tool using Gamma.
 * Creates slide decks from topic descriptions.
 */

import Anthropic from "@anthropic-ai/sdk";
import { getIntegrationApiKey } from "@/lib/integrations";
import type { SendFn } from "../runtime";

// ─── Tool Definition ───────────────────────────────────────────

export const PRESENTATION_TOOL: Anthropic.Tool = {
  name: "generate_presentation",
  description:
    "Generate a presentation/slide deck using Gamma AI. Returns a link to the presentation. Use when the user asks to create slides, a pitch deck, a presentation, or a visual document.",
  input_schema: {
    type: "object" as const,
    properties: {
      topic: {
        type: "string",
        description:
          "The topic or title of the presentation. Be descriptive.",
      },
      description: {
        type: "string",
        description:
          "Detailed description of what the presentation should cover, including key points, audience, and tone.",
      },
      num_slides: {
        type: "number",
        description: "Number of slides to generate. Defaults to 8.",
      },
    },
    required: ["topic"],
  },
};

// ─── Tool Handler ──────────────────────────────────────────────

export async function handlePresentation(
  input: Record<string, unknown>,
  send: SendFn
): Promise<string> {
  const topic = input.topic as string;
  const description = (input.description as string) || topic;

  if (!topic) return "Error: No topic provided.";

  const apiKey = await getIntegrationApiKey("gamma");
  if (!apiKey) {
    return "Gamma is not connected. Please connect it in Settings > Integrations to enable presentation generation.";
  }

  send("step", { text: "Generating presentation..." });

  try {
    const res = await fetch("https://api.gamma.app/v1/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "presentation",
        topic,
        description,
        numCards: (input.num_slides as number) || 8,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return `Gamma error (${res.status}): ${errText.slice(0, 200)}`;
    }

    const generation = await res.json();
    let presentationUrl: string | null = generation.url || null;

    // If async, poll for completion
    if (!presentationUrl && generation.id) {
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const poll = await fetch(
          `https://api.gamma.app/v1/generations/${generation.id}`,
          {
            headers: { Authorization: `Bearer ${apiKey}` },
          }
        );
        const status = await poll.json();
        if (status.url) {
          presentationUrl = status.url;
          break;
        }
        if (status.status === "failed") {
          return `Presentation generation failed: ${status.error || "Unknown error"}`;
        }
      }
    }

    if (!presentationUrl) {
      return "Presentation generation timed out. Please try again.";
    }

    send("step_complete", { text: "Presentation created" });
    send("media_output", {
      type: "presentation",
      url: presentationUrl,
      title: topic,
    });

    return `Presentation created successfully: ${presentationUrl}`;
  } catch (err) {
    return `Presentation error: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}
