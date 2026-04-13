import type {
  VideoTranscriptionProvider,
  VideoTranscriptionInput,
  VideoTranscriptionResult,
  VideoUtterance,
} from "../types";
import { getVideoConfig } from "../config";
import { formatTimestamp } from "../processing";
import { DeepgramVideoTranscriptionProvider } from "./providers/deepgram.provider";

// ─── Provider Registry ───────────────────────────────────────────

const providers: Map<string, VideoTranscriptionProvider> = new Map();

function registerProvider(provider: VideoTranscriptionProvider): void {
  providers.set(provider.slug, provider);
}

// Register built-in providers
registerProvider(new DeepgramVideoTranscriptionProvider());

// ─── Transcription Sub-Service ──────────────────────────────────

export class TranscriptionSubService {
  /**
   * Transcribe video using the configured primary provider (with fallbacks).
   */
  async transcribe(
    input: VideoTranscriptionInput
  ): Promise<VideoTranscriptionResult> {
    const config = await getVideoConfig();
    const providerChain = [
      config.transcription.primary,
      ...(config.transcription.fallbacks ?? []),
    ];

    const resolvedInput: VideoTranscriptionInput = {
      ...input,
      model: input.model ?? config.defaults.transcriptionModel,
      language: input.language ?? config.defaults.language,
      diarize: input.diarize ?? config.defaults.diarize,
    };

    let lastError: Error | null = null;

    for (const slug of providerChain) {
      const provider = providers.get(slug);
      if (!provider) continue;

      try {
        const available = await provider.isAvailable();
        if (!available) {
          console.warn(
            `[Video/Transcription] Provider "${slug}" not available, trying next...`
          );
          continue;
        }

        return await provider.transcribe(resolvedInput);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(
          `[Video/Transcription] Provider "${slug}" failed: ${lastError.message}`
        );
      }
    }

    throw lastError ?? new Error("No video transcription provider available");
  }

  /**
   * Transcribe and return a formatted speaker-diarized transcript string.
   * Drop-in replacement for the old transcribeVideo() function.
   */
  async transcribeAndFormat(filePath: string): Promise<string> {
    const result = await this.transcribe({
      source: { type: "file", path: filePath },
    });

    return formatVideoTranscript(result);
  }

  /**
   * Get a specific provider by slug.
   */
  getProvider(slug: string): VideoTranscriptionProvider | undefined {
    return providers.get(slug);
  }

  /**
   * List all registered providers.
   */
  listProviders(): VideoTranscriptionProvider[] {
    return Array.from(providers.values());
  }
}

// ─── Formatting ──────────────────────────────────────────────────

/**
 * Format a VideoTranscriptionResult into a speaker-diarized transcript string.
 *   [00:00:01 - Speaker 1] Hello and welcome to today's session.
 */
export function formatVideoTranscript(
  result: VideoTranscriptionResult
): string {
  if (!result.utterances || result.utterances.length === 0) {
    return result.text || "[No speech detected in this video]";
  }

  return result.utterances
    .map(
      (u: VideoUtterance) =>
        `[${formatTimestamp(u.start)} - Speaker ${u.speaker}] ${u.text}`
    )
    .join("\n");
}
