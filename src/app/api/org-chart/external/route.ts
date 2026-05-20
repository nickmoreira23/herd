import { apiSuccess } from "@/lib/api-utils";

// External org chart removed in Sub-etapa 3.6 — NetworkProfile.networkType
// dropped (INTERNAL/EXTERNAL distinction no longer modeled). Route preserved
// as empty response to avoid 404 on legacy consumers; full removal planned
// in Sub-etapa 3.7 (network tool split).
export async function GET() {
  return apiSuccess({ profiles: [] });
}
