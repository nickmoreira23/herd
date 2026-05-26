import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import type { MemberRole } from "@prisma/client";
import { getActor } from "./get-actor";
import type { Session } from "next-auth";

/**
 * Role-based gate — alternative to requireSuperAdmin for org-scoped routes.
 *
 * Checks:
 * 1. Session exists.
 * 2. session.user.activeOrgId exists.
 * 3. Super_admin → bypass (always allowed).
 * 4. Actor has ACTIVE membership in activeOrgId.
 * 5. Actor holds at least one role from allowedRoles.
 *
 * Returns Session if authorized, Response (401/400/403/404) otherwise.
 * Same call pattern as requireSuperAdmin — compatible with existing route handlers.
 */
export async function requireOrgRole(
  allowedRoles: MemberRole[]
): Promise<Session | Response> {
  const session = await auth();
  if (!session?.user) return apiError("Authentication required", 401);

  const activeOrgId = session.user.activeOrgId;
  if (!activeOrgId) return apiError("No active organization", 400);

  const actor = await getActor(session);
  if (!actor) return apiError("Profile not found", 404);

  // Super_admin bypass
  if (actor.isSuperAdmin) return session;

  // Find membership
  const membership = actor.memberships.find(
    (m) => m.organizationId === activeOrgId
  );
  if (!membership) return apiError("Not a member of this organization", 403);

  // Check role match
  const hasAllowedRole = membership.roles.some((r) =>
    allowedRoles.includes(r.role)
  );
  if (!hasAllowedRole) {
    return apiError(
      `Forbidden: requires one of [${allowedRoles.join(", ")}]`,
      403
    );
  }

  return session;
}
