import { prisma } from "@/lib/prisma";
import type { VideoConfig } from "./types";

// ─── Default Configuration ───────────────────────────────────────

const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  transcription: { primary: "deepgram" },
  generation: { primary: "runway" },
  storage: { primary: "local" },
  defaults: {
    transcriptionModel: "nova-3",
    language: "en",
    diarize: true,
    maxDurationSec: 600,
    allowedFormats: ["MP4", "MOV", "WEBM", "AVI"],
  },
};

// ─── Config Resolution ───────────────────────────────────────────

let cachedConfig: VideoConfig | null = null;

/**
 * Load video config from DB, falling back to defaults.
 */
export async function getVideoConfig(): Promise<VideoConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    const row = await prisma.foundationServiceConfig.findUnique({
      where: { service: "video" },
    });

    if (row?.configJson) {
      const stored = JSON.parse(row.configJson) as Partial<VideoConfig>;
      cachedConfig = mergeConfig(DEFAULT_VIDEO_CONFIG, stored);
    } else {
      cachedConfig = DEFAULT_VIDEO_CONFIG;
    }
  } catch {
    cachedConfig = DEFAULT_VIDEO_CONFIG;
  }

  return cachedConfig;
}

/**
 * Update video config in DB.
 */
export async function updateVideoConfig(
  updates: Partial<VideoConfig>
): Promise<VideoConfig> {
  const current = await getVideoConfig();
  const merged = mergeConfig(current, updates);

  await prisma.foundationServiceConfig.upsert({
    where: { service: "video" },
    create: { service: "video", configJson: JSON.stringify(merged) },
    update: { configJson: JSON.stringify(merged) },
  });

  cachedConfig = merged;
  return merged;
}

/**
 * Clear cached config (useful after config changes from other processes).
 */
export function clearVideoConfigCache(): void {
  cachedConfig = null;
}

// ─── Helpers ─────────────────────────────────────────────────────

function mergeConfig(
  base: VideoConfig,
  overrides: Partial<VideoConfig>
): VideoConfig {
  return {
    transcription: { ...base.transcription, ...overrides.transcription },
    generation: { ...base.generation, ...overrides.generation },
    storage: { ...base.storage, ...overrides.storage },
    defaults: { ...base.defaults, ...overrides.defaults },
  };
}
