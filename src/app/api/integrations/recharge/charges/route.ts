import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { RechargeService } from "@/lib/services/recharge";

export async function GET(request: Request) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "recharge" },
    });
    if (!integration) return apiError("Recharge integration not found", 404);
    if (!integration.credentials) return apiError("Recharge not connected", 400);

    const creds = JSON.parse(decrypt(integration.credentials)) as { apiToken: string };
    const svc = new RechargeService(creds.apiToken);

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
