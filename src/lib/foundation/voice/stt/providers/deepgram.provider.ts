import { readFile } from "fs/promises";
import { getIntegrationApiKey } from "@/lib/integrations";
import type { STTProvider, STTInput, STTResult, STTUtterance } from "../../types";

// ─── Deepgram STT Provider ───────────────────────────────────────

export class DeepgramSTTProvider implements STTProvider {
  name = "Deepgram";
  slug = "deepgram";

  async isAvailable(): Promise<boolean> {
    const key = await this.resolveApiKey();
    return !!key;
  }

  async transcribe(input: STTInput): Promise<STTResult> {
    const apiKey = await this.resolveApiKey();
    if (!apiKey) {
      throw new Error(
        "Deepgram API key not configured. Connect Deepgram in Settings → Integrations, or set DEEPGRAM_API_KEY."
      );
    }

    const audioBuffer = await this.resolveInputBuffer(input);
    const audioSizeMB = audioBuffer.length / (1024 * 1024);
    console.log(
      `[Voice/STT] Transcribing ${audioSizeMB.toFixed(2)} MB via Deepgram...`
    );

    const { DeepgramClient } = await import("@deepgram/sdk");
    const deepgram = new DeepgramClient({ apiKey });

    const response = await deepgram.listen.v1.media.transcribeFile(
      audioBuffer,
      {
        model: input.model ?? "nova-3",
        smart_format: input.smartFormat ?? true,
        punctuate: input.punctuate ?? true,
        diarize: input.diarize ?? true,
        utterances: true,
        language: input.language,
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (response as any).body ?? (response as any).result ?? response;

    if (!result) {
      throw new Error("Deepgram returned no result");
    }

    return this.parseResult(result);
  }

  // ── Private ────────────────────────────────────────────────────

  private async resolveApiKey(): Promise<string | null> {
    // Integration system first
    const integrationKey = await getIntegrationApiKey("deepgram");
    if (integrationKey) return integrationKey;

    // Env var fallback
    if (process.env.DEEPGRAM_API_KEY) return process.env.DEEPGRAM_API_KEY;

    // Last resort: read from .env file directly
    try {
      const { readFileSync } = await import("fs");
      const { join } = await import("path");
      const envPath = join(process.cwd(), ".env");
      const envContent = readFileSync(envPath, "utf-8");
      const match = envContent.match(
        /^DEEPGRAM_API_KEY=["']?([^"'\n]+)["']?/m
      );
      if (match) return match[1];
    } catch {
      // ignore
    }

    return null;
  }

  private async resolveInputBuffer(input: STTInput): Promise<Buffer> {
    switch (input.source.type) {
      case "file":
        return readFile(input.source.path);
      case "buffer":
        return input.source.data;
      case "url": {
        const res = await fetch(input.source.url);
        if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status}`);
        return Buffer.from(await res.arrayBuffer());
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseResult(result: any): STTResult {
    const utterances = result.results?.utterances;

    if (utterances && utterances.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed: STTUtterance[] = utterances.map((u: any) => ({
        speaker: u.speaker !== undefined ? u.speaker + 1 : 0,
        text: u.transcript,
        start: u.start,
        end: u.end,
        confidence: u.confidence,
      }));

      return {
        text: parsed.map((u) => u.text).join(" "),
        utterances: parsed,
        duration: result.metadata?.duration,
        confidence: result.results?.channels?.[0]?.alternatives?.[0]?.confidence,
        provider: this.slug,
      };
    }

    // Fallback: build from word-level channel data
    const channels = result.results?.channels;
    if (channels && channels.length > 0) {
      const words = channels[0].alternatives?.[0]?.words ?? [];

      if (words.length === 0) {
        return {
          text: "",
          utterances: [],
          duration: result.metadata?.duration,
          provider: this.slug,
        };
      }

      const segments = this.groupWordsBySpeaker(words);
      return {
        text: segments.map((s) => s.text).join(" "),
        utterances: segments,
        duration: result.metadata?.duration,
        provider: this.slug,
      };
    }

    return { text: "", utterances: [], provider: this.slug };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private groupWordsBySpeaker(words: any[]): STTUtterance[] {
    const segments: STTUtterance[] = [];
    let currentSpeaker = -1;
    let currentStart = 0;
    let currentEnd = 0;
    let currentText = "";

    for (const word of words) {
      const speaker = (word.speaker ?? 0) + 1;
      if (speaker !== currentSpeaker) {
        if (currentText) {
          segments.push({
            speaker: currentSpeaker,
            start: currentStart,
            end: currentEnd,
            text: currentText.trim(),
          });
        }
        currentSpeaker = speaker;
        currentStart = word.start;
        currentText = word.punctuated_word ?? word.word;
      } else {
        currentText += " " + (word.punctuated_word ?? word.word);
      }
      currentEnd = word.end;
    }

    if (currentText) {
      segments.push({
        speaker: currentSpeaker,
        start: currentStart,
        end: currentEnd,
        text: currentText.trim(),
      });
    }

    return segments;
  }
}
