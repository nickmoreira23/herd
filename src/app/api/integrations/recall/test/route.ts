import { apiSuccess, apiError } from "@/lib/api-utils";
import { RecallAiService } from "@/lib/services/recall-ai";

/**
 * POST — Test the stored Recall.ai connection.
 */
export async function POST() {
  const service = await RecallAiService.fromIntegration();
  if (!service) {
    return apiError("Recall.ai is not connected", 400);
  }

  const ok = await service.testConnection();
  if (!ok) {
    return apiError("Connection test failed", 500);
  }

  return apiSuccess({ ok: true });
}
