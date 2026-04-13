import { apiSuccess, apiError } from "@/lib/api-utils";
import { getVoiceConfig, updateVoiceConfig } from "@/lib/foundation/voice/config";

/**
 * GET /api/foundation/voice/config
 *
 * Returns the current voice service configuration.
 */
export async function GET() {
  const config = await getVoiceConfig();
  return apiSuccess(config);
}

/**
 * PATCH /api/foundation/voice/config
 *
 * Update voice service configuration (partial merge).
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateVoiceConfig(body);
    return apiSuccess(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update config";
    return apiError(message, 500);
  }
}
