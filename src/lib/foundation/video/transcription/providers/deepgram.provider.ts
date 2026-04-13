import { readFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { getIntegrationApiKey } from "@/lib/integrations";
import type {
  VideoTranscriptionProvider,
  VideoTranscriptionInput,
  VideoTranscriptionResult,
  VideoUtterance,
} from "../../types";
import { FFmpegVideoProcessor } from "../../processing";

// ─── Deepgram Video Transcription Provider ──────────────────────

export class DeepgramVideoTranscriptionProvider
  implements VideoTranscriptionProvider
{
  name = "Deepgram";
  slug = "deepgram";

  private processor = new FFmpegVideoProcessor();

  async isAvailable(): Promise<boolean> {
    const key = await this.resolveApiKey();
    return !!key;
  }

  async transcribe(
    input: VideoTranscriptionInput
  ): Promise<VideoTranscriptionResult> {
    const apiKey = await this.resolveApiKey();
    if (!apiKey) {
      throw new Error(
        "Deepgram API key not configured. Connect Deepgram in Settings → Integrations, or set DEEPGRAM_API_KEY."
      );
    }

    // Resolve input to a file path (for audio extraction)
    const filePath = await this.resolveFilePath(input);

    // Extract audio from video to temp file
    const tempAudioPath = path.join(
      os.tmpdir(),
      `herd-video-audio-${Date.now()}.mp3`
    );

    try {
      console.log("[Video/Transcription] Extracting audio from video...");
      await this.processor.extractAudio(filePath, tempAudioPath);

      const audioBuffer = await readFile(tempAudioPath);
      const audioSizeMB = audioBuffer.length / (1024 * 1024);
      console.log(
        `[Video/Transcription] Audio extracted: ${audioSizeMB.toFixed(2)} MB. Sending to Deepgram...`
      );

      const { DeepgramClient } = await import("@deepgram/sdk");
      const deepgram = new DeepgramClient({ apiKey });

      const response = await deepgram.listen.v1.media.transcribeFile(
        audioBuffer,
        {
          model: input.model ?? "nova-3",
          smart_format: true,
          punctuate: true,
          diarize: input.diarize ?? true,
          utterances: true,
          language: input.language,
        }
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (response as any).body ?? (response as any).result ?? response;

      if (!result) {
        throw new Error("Deepgram returned no result");
      }

      return this.parseResult(result);
    } finally {
      try {
        await unlink(tempAudioPath);
      } catch {
        // ignore cleanup errors
      }
    }
  }

  // ── Private ────────────────────────────────────────────────────

  private async resolveApiKey(): Promise<string | null> {
    const integrationKey = await getIntegrationApiKey("deepgram");
    if (integrationKey) return integrationKey;

    if (process.env.DEEPGRAM_API_KEY) return process.env.DEEPGRAM_API_KEY;

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

  private async resolveFilePath(
    input: VideoTranscriptionInput
  ): Promise<string> {
    switch (input.source.type) {
      case "file":
        return input.source.path;
      case "buffer": {
        const tmpPath = path.join(
          os.tmpdir(),
          `herd-video-${Date.now()}.tmp`
        );
        const { writeFile } = await import("fs/promises");
        await writeFile(tmpPath, input.source.data);
        return tmpPath;
      }
      case "url": {
        const res = await fetch(input.source.url);
        if (!res.ok) throw new Error(`Failed to fetch video: ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        const tmpPath = path.join(
          os.tmpdir(),
          `herd-video-${Date.now()}.tmp`
        );
        const { writeFile } = await import("fs/promises");
        await writeFile(tmpPath, buffer);
        return tmpPath;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseResult(result: any): VideoTranscriptionResult {
    const utterances = result.results?.utterances;

    if (utterances && utterances.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed: VideoUtterance[] = utterances.map((u: any) => ({
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
        confidence:
          result.results?.channels?.[0]?.alternatives?.[0]?.confidence,
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
  private groupWordsBySpeaker(words: any[]): VideoUtterance[] {
    const segments: VideoUtterance[] = [];
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
