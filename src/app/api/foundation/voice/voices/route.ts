import { apiSuccess, apiError } from "@/lib/api-utils";
import { getVoiceService } from "@/lib/foundation/voice";

/**
 * GET /api/foundation/voice/voices
 *
 * List all available TTS voices across all configured providers.
 */
export async function GET() {
  try {
    const voiceService = getVoiceService();
    const voices = await voiceService.listVoices();
    return apiSuccess(voices);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list voices";
    return apiError(message, 500);
  }
}
