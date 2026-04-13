import type {
  VideoStorageProvider,
  VideoUploadInput,
  VideoUploadResult,
} from "../types";
import { getVideoConfig } from "../config";
import { LocalVideoStorageProvider } from "./providers/local.provider";

// ─── Provider Registry ───────────────────────────────────────────

const providers: Map<string, VideoStorageProvider> = new Map();

function registerProvider(provider: VideoStorageProvider): void {
  providers.set(provider.slug, provider);
}

// Register built-in providers
registerProvider(new LocalVideoStorageProvider());

// ─── Storage Sub-Service ────────────────────────────────────────

export class StorageSubService {
  /**
   * Upload video using the configured primary provider (with fallbacks).
   */
  async upload(input: VideoUploadInput): Promise<VideoUploadResult> {
    const config = await getVideoConfig();
    const providerChain = [
      config.storage.primary,
      ...(config.storage.fallbacks ?? []),
    ];

    let lastError: Error | null = null;

    for (const slug of providerChain) {
      const provider = providers.get(slug);
      if (!provider) continue;

      try {
        const available = await provider.isAvailable();
        if (!available) {
          console.warn(
            `[Video/Storage] Provider "${slug}" not available, trying next...`
          );
          continue;
        }

        return await provider.upload(input);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(
          `[Video/Storage] Provider "${slug}" failed: ${lastError.message}`
        );
      }
    }

    throw lastError ?? new Error("No video storage provider available");
  }

  /**
   * Delete a video file using the configured primary provider.
   */
  async delete(fileUrl: string): Promise<void> {
    const config = await getVideoConfig();
    const provider = providers.get(config.storage.primary);
    if (provider) {
      await provider.delete(fileUrl);
    }
  }

  /**
   * Get a specific provider by slug.
   */
  getProvider(slug: string): VideoStorageProvider | undefined {
    return providers.get(slug);
  }

  /**
   * List all registered providers.
   */
  listProviders(): VideoStorageProvider[] {
    return Array.from(providers.values());
  }
}
