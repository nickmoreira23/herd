import { apiSuccess, apiError } from "@/lib/api-utils";
import { RechargeService } from "@/lib/services/recharge";

export async function GET(request: Request) {
  try {
    const svc = await RechargeService.fromIntegration();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const plans = await svc.listPlans({ page, limit });
    return apiSuccess(plans);
  } catch (e) {
    console.error("GET /api/integrations/recharge/plans error:", e);
    return apiError("Failed to fetch Recharge plans", 500);
  }
}
