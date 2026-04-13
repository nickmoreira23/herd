/**
 * Text-to-speech tool using ElevenLabs.
 * Generates audio from text and returns a playable URL.
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getIntegrationApiKey } from "@/lib/integrations";
import type { SendFn } from "../runtime";

// ─── Tool Definition ───────────────────────────────────────────

export const TTS_TOOL: Anthropic.Tool = {
  name: "text_to_speech",
  description:
    "Convert text to spoken audio using ElevenLabs. Returns a playable audio URL. Use when the user asks you to read something aloud, generate a voiceover, or create audio content.",
  input_schema: {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "The text to convert to speech (max 5000 characters)",
      },
      voice_id: {
        type: "string",
        description:
          "ElevenLabs voice ID. Defaults to Rachel (21m00Tcm4TlvDq8ikWAM) if not specified.",
      },
    },
    required: ["text"],
  },
};

// ─── Tool Handler ──────────────────────────────────────────────

export async function handleTTS(
  input: Record<string, unknown>,
  send: SendFn
): Promise<string> {
  const text = (input.text as string)?.slice(0, 5000);
  const voiceId = (input.voice_id as string) || "21m00Tcm4TlvDq8ikWAM";

  if (!text) return "Error: No text provided.";

  const apiKey = await getIntegrationApiKey("elevenlabs");
  if (!apiKey) {
    return "ElevenLabs is not connected. Please connect it in Settings > Integrations to enable text-to-speech.";
  }

  send("step", { text: "Generating audio..." });

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return `ElevenLabs error (${res.status}): ${errText.slice(0, 200)}`;
    }

    // Save audio file
    const audioBuffer = Buffer.from(await res.arrayBuffer());
    const fileName = `tts_${Date.now()}.mp3`;
    const outputDir = path.join(process.cwd(), "public/uploads/chat/audio");
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, fileName), audioBuffer);

    const audioUrl = `/uploads/chat/audio/${fileName}`;

    send("step_complete", { text: "Audio generated" });
    send("media_output", {
      type: "audio",
      url: audioUrl,
      mimeType: "audio/mpeg",
      fileName,
    });

    return `Audio generated successfully. The audio player is shown above. URL: ${audioUrl}`;
  } catch (err) {
    return `TTS error: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}
