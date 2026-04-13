import type {
  VideoGenerationProvider,
  VideoGenerationInput,
  VideoGenerationResult,
} from "../types";
import { getVideoConfig } from "../config";
import { RunwayGenerationProvider } from "./providers/runway.provider";
import { HeyGenGenerationProvider } from "./providers/heygen.provider";

// ─── Provider Registry ───────────────────────────────────────────

const providers: Map<string, VideoGenerationProvider> = new Map();

function registerProvider(provider: VideoGenerationProvider): void {
  providers.set(provider.slug, provider);
}

// Register built-in providers
registerProvider(new RunwayGenerationProvider());
registerProvider(new HeyGenGenerationProvider());

// ─── Generation Sub-Service ─────────────────────────────────────

export class GenerationSubService {
  /**
   * Generate video using the configured primary provider (with fallbacks).
   */
  async generate(
    input: VideoGenerationInput
  ): Promise<VideoGenerationResult> {
    const config = await getVideoConfig();
    const providerChain = [
      config.generation.primary,
      ...(config.generation.fallbacks ?? []),
    ];

    let lastError: Error | null = null;

    for (const slug of providerChain) {
      const provider = providers.get(slug);
      if (!provider) continue;

      try {
        const available = await provider.isAvailable();
        if (!available) {
          console.warn(
            `[Video/Generation] Provider "${slug}" not available, trying next...`
          );
          continue;
        }

        return await provider.generate(input);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(
          `[Video/Generation] Provider "${slug}" failed: ${lastError.message}`
        );
      }
    }

    throw lastError ?? new Error("No video generation provider available");
  }

  /**
   * Get a specific provider by slug.
   */
  getProvider(slug: string): VideoGenerationProvider | undefined {
    return providers.get(slug);
  }

  /**
   * List all registered providers.
   */
  listProviders(): VideoGenerationProvider[] {
    return Array.from(providers.values());
  }
}
