import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import type { MemberRole } from "@prisma/client";
import { getActor } from "./get-actor";
import type { Session } from "next-auth";

/**
 * Role-based gate — alternative to requireSuperAdmin for org-scoped routes.
 *
 * Org resolution order (Sub-etapa 22 V2 + 23 expansion):
 * 1. x-org-id header (injected by proxy.ts based on request host) — PRIMARY.
 * 2. session.user.activeOrgId from JWT — FALLBACK (apex/login flow).
 *
 * This means route handlers always see the correct org for the host they
 * are running under, without any JWT mutation or org-switch endpoint.
 * Consumer routes continue to use session.user.activeOrgId — the value
 * now reflects the effective org derived from the host.
 *
 * Checks:
 * 1. Session exists.
 * 2. effectiveOrgId resolved (header or JWT).
 * 3. Super_admin → bypass (always allowed), session enriched with effectiveOrgId.
 * 4. Actor has ACTIVE membership in effectiveOrgId (security: cannot access orgs not member of).
 * 5. Actor holds at least one role from allowedRoles.
 *
 * Returns Session (with activeOrgId = effectiveOrgId) if authorized,
 * Response (401/400/403/404) otherwise.
 */
export async function requireOrgRole(
  allowedRoles: MemberRole[]
): Promise<Session | Response> {
  const session = await auth();
  if (!session?.user) return apiError("Authentication required", 401);

  // 1. Host-based org is primary; JWT is fallback
  const headerOrgId = await getOrgIdFromRequest();
  const effectiveOrgId = headerOrgId ?? session.user.activeOrgId ?? null;
  if (!effectiveOrgId) return apiError("No active organization", 400);

  const actor = await getActor(session);
  if (!actor) return apiError("Profile not found", 404);

  // Build enriched session with the effective org
  const enrichedSession: Session = {
    ...session,
    user: { ...session.user, activeOrgId: effectiveOrgId },
  };

  // Super_admin bypass — membership check skipped, but orgId is still set
  if (actor.isSuperAdmin) return enrichedSession;

  // Find membership in the effective org
  const membership = actor.memberships.find(
    (m) => m.organizationId === effectiveOrgId
  );
  if (!membership) return apiError("Not a member of this organization", 403);

  // Check role match. Custom-role rows (role === null) carry no system-role gate;
  // only system roles satisfy requireOrgRole. Custom-role authz is can()'s job.
  const hasAllowedRole = membership.roles.some(
    (r) => r.role !== null && allowedRoles.includes(r.role)
  );
  if (!hasAllowedRole) {
    return apiError(
      `Forbidden: requires one of [${allowedRoles.join(", ")}]`,
      403
    );
  }

  return enrichedSession;
}
