import type { STTProvider, STTInput, STTResult, STTUtterance } from "../types";
import { getVoiceConfig } from "../config";
import { DeepgramSTTProvider } from "./providers/deepgram.provider";

// ─── Provider Registry ───────────────────────────────────────────

const providers: Map<string, STTProvider> = new Map();

function registerProvider(provider: STTProvider): void {
  providers.set(provider.slug, provider);
}

// Register built-in providers
registerProvider(new DeepgramSTTProvider());

// ─── STT Sub-Service ─────────────────────────────────────────────

export class STTSubService {
  /**
   * Transcribe audio using the configured primary provider (with fallbacks).
   */
  async transcribe(input: STTInput): Promise<STTResult> {
    const config = await getVoiceConfig();
    const providerChain = [
      config.stt.primary,
      ...(config.stt.fallbacks ?? []),
    ];

    // Apply defaults from config
    const resolvedInput: STTInput = {
      ...input,
      model: input.model ?? config.defaults.sttModel,
      language: input.language ?? config.defaults.sttLanguage,
      diarize: input.diarize ?? config.defaults.diarize,
    };

    let lastError: Error | null = null;

    for (const slug of providerChain) {
      const provider = providers.get(slug);
      if (!provider) continue;

      try {
        const available = await provider.isAvailable();
        if (!available) {
          console.warn(`[Voice/STT] Provider "${slug}" not available, trying next...`);
          continue;
        }

        return await provider.transcribe(resolvedInput);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[Voice/STT] Provider "${slug}" failed: ${lastError.message}`);
      }
    }

    throw lastError ?? new Error("No STT provider available");
  }

  /**
   * Transcribe and return a formatted speaker-diarized transcript string.
   * Drop-in replacement for the old transcribeAudio() function.
   */
  async transcribeAndFormat(filePath: string): Promise<string> {
    const result = await this.transcribe({
      source: { type: "file", path: filePath },
    });

    return formatTranscript(result);
  }

  /**
   * Get a specific provider by slug.
   */
  getProvider(slug: string): STTProvider | undefined {
    return providers.get(slug);
  }

  /**
   * List all registered providers.
   */
  listProviders(): STTProvider[] {
    return Array.from(providers.values());
  }
}

// ─── Formatting ──────────────────────────────────────────────────

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Format an STTResult into a speaker-diarized transcript string.
 * Matches the format that the old transcribeAudio() produced:
 *   [00:00:01 - Speaker 1] Hello and welcome to today's session.
 */
export function formatTranscript(result: STTResult): string {
  if (!result.utterances || result.utterances.length === 0) {
    return result.text || "[No speech detected in this audio]";
  }

  return result.utterances
    .map(
      (u: STTUtterance) =>
        `[${formatTimestamp(u.start)} - Speaker ${u.speaker}] ${u.text}`
    )
    .join("\n");
}
