import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

/**
 * POST /api/auth/switch-org
 *
 * Validates that the current user has an ACTIVE membership in the requested
 * organization, then returns a redirectUrl to that org's subdomain.
 *
 * Strategy (D1 — Sub-etapa 22.2): redirect-based switch, no JWT mutation.
 * The host-based tenant resolution (Sub-etapa 23) means switching orgs is
 * simply navigating to a different subdomain. The cross-subdomain session
 * cookie (COOKIE_DOMAIN, Sub-etapa 22.1) carries auth across subdomains.
 *
 * Returns { data: { redirectUrl: string } } — client does window.location.href.
 * Server-side 302 is NOT used: fetch POST + 302 has inconsistent browser
 * handling across environments (CORS, credentials, redirect following).
 */
export async function POST(request: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return apiError("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const orgId = body?.orgId;

  if (!orgId || typeof orgId !== "string") {
    return apiError("orgId required", 400);
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      networkProfileId: userId,
      organizationId: orgId,
      status: "ACTIVE",
    },
    include: {
      organization: {
        select: { id: true, subdomain: true, status: true },
      },
    },
  });

  if (!membership || membership.organization.status !== "ACTIVE") {
    return apiError("Not a member of this organization", 403);
  }

  const apexHost = process.env.APEX_HOST ?? "lvh.me";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const port = process.env.NODE_ENV === "production" ? "" : ":3000";
  const targetUrl = `${protocol}://${membership.organization.subdomain}.${apexHost}${port}/admin`;

  return apiSuccess({ redirectUrl: targetUrl });
}
