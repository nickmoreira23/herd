import { apiSuccess, apiError } from "@/lib/api-utils";
import { RechargeService } from "@/lib/services/recharge";

export async function GET(request: Request) {
  try {
    const svc = await RechargeService.fromIntegration();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const customers = await svc.listCustomers({ email, page, limit });
    return apiSuccess(customers);
  } catch (e) {
    console.error("GET /api/integrations/recharge/customers error:", e);
    return apiError("Failed to fetch Recharge customers", 500);
  }
}
