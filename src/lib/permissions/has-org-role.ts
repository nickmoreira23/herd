import { auth } from "@/lib/auth";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import type { MemberRole } from "@prisma/client";
import { getActor } from "./get-actor";

/**
 * Boolean sibling of `requireOrgRole` — same resolution (host-based org →
 * JWT fallback, super_admin bypass, ACTIVE membership, role match) but returns
 * `true`/`false` instead of `Session | Response`.
 *
 * Use where a Response is the wrong shape — e.g. gating individual streaming
 * agent tools by role without short-circuiting the whole route (L1.0b). For
 * HTTP route handlers, prefer `requireOrgRole` (returns the 401/403 Response).
 */
export async function hasOrgRole(allowedRoles: MemberRole[]): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  const headerOrgId = await getOrgIdFromRequest();
  const effectiveOrgId = headerOrgId ?? session.user.activeOrgId ?? null;
  if (!effectiveOrgId) return false;

  const actor = await getActor(session);
  if (!actor) return false;

  if (actor.isSuperAdmin) return true;

  const membership = actor.memberships.find(
    (m) => m.organizationId === effectiveOrgId
  );
  if (!membership) return false;

  return membership.roles.some(
    (r) => r.role !== null && allowedRoles.includes(r.role)
  );
}
