import type { VoiceModeProvider, VoiceModeConfig, VoiceModeSession } from "../types";
import { getVoiceConfig } from "../config";

// ─── Provider Registry ───────────────────────────────────────────

const providers: Map<string, VoiceModeProvider> = new Map();

export function registerVoiceModeProvider(provider: VoiceModeProvider): void {
  providers.set(provider.slug, provider);
}

// ─── Voice Mode Sub-Service ──────────────────────────────────────

export class VoiceModeSubService {
  /**
   * Create a real-time voice session using the configured provider.
   */
  async createSession(config: VoiceModeConfig): Promise<VoiceModeSession> {
    const voiceConfig = await getVoiceConfig();
    const providerChain = [
      voiceConfig.voiceMode.primary,
      ...(voiceConfig.voiceMode.fallbacks ?? []),
    ];

    let lastError: Error | null = null;

    for (const slug of providerChain) {
      const provider = providers.get(slug);
      if (!provider) continue;

      try {
        const available = await provider.isAvailable();
        if (!available) {
          console.warn(`[Voice/Mode] Provider "${slug}" not available, trying next...`);
          continue;
        }

        return await provider.createSession(config);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[Voice/Mode] Provider "${slug}" failed: ${lastError.message}`);
      }
    }

    throw lastError ?? new Error("No voice mode provider available. Configure a provider in Foundations → Voice.");
  }

  /**
   * Check if any voice mode provider is available.
   */
  async isAvailable(): Promise<boolean> {
    for (const provider of providers.values()) {
      try {
        if (await provider.isAvailable()) return true;
      } catch {
        continue;
      }
    }
    return false;
  }

  getProvider(slug: string): VoiceModeProvider | undefined {
    return providers.get(slug);
  }

  listProviders(): VoiceModeProvider[] {
    return Array.from(providers.values());
  }
}
