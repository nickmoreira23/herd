import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { getAgentConfig, updateAgentConfig } from "@/lib/meetings/meeting-agent";

/**
 * GET — Retrieve the meeting agent configuration.
 */
export async function GET() {
  try {
    const config = await getAgentConfig();
    return apiSuccess({ config });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch config";
    return apiError(msg, 500);
  }
}

/**
 * PATCH — Update the meeting agent configuration.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const config = await updateAgentConfig(body);
    return apiSuccess({ config });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update config";
    return apiError(msg, 500);
  }
}
