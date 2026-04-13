import { apiSuccess, apiError } from "@/lib/api-utils";
import {
  getVideoConfig,
  updateVideoConfig,
} from "@/lib/foundation/video/config";

/**
 * GET /api/foundation/video/config
 *
 * Returns the current video service configuration.
 */
export async function GET() {
  const config = await getVideoConfig();
  return apiSuccess(config);
}

/**
 * PATCH /api/foundation/video/config
 *
 * Update video service configuration (partial merge).
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateVideoConfig(body);
    return apiSuccess(updated);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update config";
    return apiError(message, 500);
  }
}
