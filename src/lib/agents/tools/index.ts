/**
 * Multimodal tool registry.
 *
 * Auto-adds generation tools to an agent based on its DB boolean flags
 * (canGenerateImages, canGenerateAudio, canGenerateVideo, canGeneratePresentations).
 */

import Anthropic from "@anthropic-ai/sdk";
import type { SendFn } from "../runtime";
import { TTS_TOOL, handleTTS } from "./tts-tool";
import { IMAGE_GENERATION_TOOL, handleImageGeneration } from "./image-generation-tool";
import { VIDEO_GENERATION_TOOL, handleVideoGeneration } from "./video-generation-tool";
import { PRESENTATION_TOOL, handlePresentation } from "./presentation-tool";
import { VISION_TOOL, handleVision } from "./vision-tool";

// ─── Types ─────────────────────────────────────────────────────

interface MultimodalFlags {
  canGenerateImages?: boolean;
  canGenerateAudio?: boolean;
  canGenerateVideo?: boolean;
  canGeneratePresentations?: boolean;
  acceptsImages?: boolean;
}

// ─── Build tools from flags ────────────────────────────────────

/**
 * Returns the Anthropic tool definitions to add based on agent flags.
 */
export function getMultimodalTools(flags: MultimodalFlags): Anthropic.Tool[] {
  const tools: Anthropic.Tool[] = [];

  if (flags.canGenerateAudio) tools.push(TTS_TOOL);
  if (flags.canGenerateImages) tools.push(IMAGE_GENERATION_TOOL);
  if (flags.canGenerateVideo) tools.push(VIDEO_GENERATION_TOOL);
  if (flags.canGeneratePresentations) tools.push(PRESENTATION_TOOL);
  if (flags.acceptsImages) tools.push(VISION_TOOL);

  return tools;
}

/**
 * Handle a multimodal tool call. Returns the result string if handled,
 * or null if the tool is not a multimodal tool.
 */
export async function handleMultimodalToolCall(
  toolName: string,
  input: Record<string, unknown>,
  send: SendFn,
  anthropic?: Anthropic
): Promise<string | null> {
  switch (toolName) {
    case "text_to_speech":
      return handleTTS(input, send);

    case "generate_image":
      return handleImageGeneration(input, send);

    case "generate_video":
      return handleVideoGeneration(input, send);

    case "generate_presentation":
      return handlePresentation(input, send);

    case "analyze_image":
      if (!anthropic) return "Vision analysis requires an Anthropic client.";
      return handleVision(input, anthropic, send);

    default:
      return null;
  }
}
