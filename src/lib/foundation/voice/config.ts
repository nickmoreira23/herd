import { prisma } from "@/lib/prisma";
import type { VoiceConfig } from "./types";

// ─── Default Configuration ───────────────────────────────────────

const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  stt: { primary: "deepgram" },
  tts: { primary: "elevenlabs" },
  voiceMode: { primary: "sesame" },
  defaults: {
    sttModel: "nova-3",
    sttLanguage: "en",
    diarize: true,
    ttsOutputFormat: "mp3",
  },
};

// ─── Config Resolution ───────────────────────────────────────────

let cachedConfig: VoiceConfig | null = null;

/**
 * Load voice config from DB, falling back to defaults.
 */
export async function getVoiceConfig(): Promise<VoiceConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    const row = await prisma.foundationServiceConfig.findUnique({
      where: { service: "voice" },
    });

    if (row?.configJson) {
      const stored = JSON.parse(row.configJson) as Partial<VoiceConfig>;
      cachedConfig = mergeConfig(DEFAULT_VOICE_CONFIG, stored);
    } else {
      cachedConfig = DEFAULT_VOICE_CONFIG;
    }
  } catch {
    cachedConfig = DEFAULT_VOICE_CONFIG;
  }

  return cachedConfig;
}

/**
 * Update voice config in DB.
 */
export async function updateVoiceConfig(
  updates: Partial<VoiceConfig>
): Promise<VoiceConfig> {
  const current = await getVoiceConfig();
  const merged = mergeConfig(current, updates);

  await prisma.foundationServiceConfig.upsert({
    where: { service: "voice" },
    create: { service: "voice", configJson: JSON.stringify(merged) },
    update: { configJson: JSON.stringify(merged) },
  });

  cachedConfig = merged;
  return merged;
}

/**
 * Clear cached config (useful after config changes from other processes).
 */
export function clearVoiceConfigCache(): void {
  cachedConfig = null;
}

// ─── Helpers ─────────────────────────────────────────────────────

function mergeConfig(
  base: VoiceConfig,
  overrides: Partial<VoiceConfig>
): VoiceConfig {
  return {
    stt: { ...base.stt, ...overrides.stt },
    tts: { ...base.tts, ...overrides.tts },
    voiceMode: { ...base.voiceMode, ...overrides.voiceMode },
    defaults: { ...base.defaults, ...overrides.defaults },
  };
}
