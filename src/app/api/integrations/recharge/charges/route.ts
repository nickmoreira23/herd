import { apiSuccess, apiError } from "@/lib/api-utils";
import { RechargeService } from "@/lib/services/recharge";

export async function GET(request: Request) {
  try {
    const svc = await RechargeService.fromIntegration();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const charges = await svc.listCharges({ status, page, limit });
    return apiSuccess(charges);
  } catch (e) {
    console.error("GET /api/integrations/recharge/charges error:", e);
    return apiError("Failed to fetch Recharge charges", 500);
  }
}
