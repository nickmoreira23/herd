import { auth } from "@/lib/auth";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { headers } from "next/headers";

/**
 * GET /api/org/current
 *
 * Returns the Organization the current request is scoped to.
 *
 * Resolution order (Sub-etapa 22 V2 + 23 expansion):
 * 1. x-org-id header (injected by proxy.ts from hostname) — PRIMARY.
 * 2. session.user.activeOrgId from JWT — FALLBACK (apex / admin pages).
 *
 * Used by the sidebar to hydrate the company name per-host without
 * relying on the platform-global Setting.companyName.
 *
 * CRAVADO Sub-etapa 23: `headers()` call opts this route out of
 * static cache (Next 16 Cache Components — same pattern as cron routes).
 */
export async function GET() {
  // Opt out of static cache (Next 16 Cache Components)
  await headers();

  const session = await auth();
  if (!session?.user) return apiError("Authentication required", 401);

  const headerOrgId = await getOrgIdFromRequest();
  const orgId = headerOrgId ?? session.user.activeOrgId ?? null;

  if (!orgId) return apiError("No active organization", 400);

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, slug: true, name: true, subdomain: true, status: true },
  });

  if (!org) return apiError("Organization not found", 404);

  return apiSuccess(org);
}
