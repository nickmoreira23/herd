import type { TTSProvider, TTSInput, TTSResult, TTSVoice } from "../types";
import { getVoiceConfig } from "../config";
import { ElevenLabsTTSProvider } from "./providers/elevenlabs.provider";

// ─── Provider Registry ───────────────────────────────────────────

const providers: Map<string, TTSProvider> = new Map();

function registerProvider(provider: TTSProvider): void {
  providers.set(provider.slug, provider);
}

registerProvider(new ElevenLabsTTSProvider());

// ─── TTS Sub-Service ─────────────────────────────────────────────

export class TTSSubService {
  /**
   * Synthesize text to speech using the configured primary provider.
   */
  async synthesize(input: TTSInput): Promise<TTSResult> {
    const config = await getVoiceConfig();
    const providerChain = [
      config.tts.primary,
      ...(config.tts.fallbacks ?? []),
    ];

    const resolvedInput: TTSInput = {
      ...input,
      outputFormat: input.outputFormat ?? config.defaults.ttsOutputFormat,
      voiceId: input.voiceId ?? config.defaults.ttsVoiceId,
    };

    let lastError: Error | null = null;

    for (const slug of providerChain) {
      const provider = providers.get(slug);
      if (!provider) continue;

      try {
        const available = await provider.isAvailable();
        if (!available) {
          console.warn(`[Voice/TTS] Provider "${slug}" not available, trying next...`);
          continue;
        }

        return await provider.synthesize(resolvedInput);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[Voice/TTS] Provider "${slug}" failed: ${lastError.message}`);
      }
    }

    throw lastError ?? new Error("No TTS provider available");
  }

  /**
   * List available voices from all registered providers.
   */
  async listVoices(): Promise<TTSVoice[]> {
    const allVoices: TTSVoice[] = [];

    for (const provider of providers.values()) {
      try {
        const available = await provider.isAvailable();
        if (!available) continue;
        const voices = await provider.listVoices();
        allVoices.push(...voices);
      } catch (err) {
        console.warn(`[Voice/TTS] Failed to list voices from ${provider.slug}:`, err);
      }
    }

    return allVoices;
  }

  getProvider(slug: string): TTSProvider | undefined {
    return providers.get(slug);
  }

  listProviders(): TTSProvider[] {
    return Array.from(providers.values());
  }
}
