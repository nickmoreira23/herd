import type { Session } from "next-auth";
import type { MemberRole } from "@prisma/client";
import { getActor } from "@/lib/permissions";

export interface ViewerContext {
  profileId: string | null;
  isSuperAdmin: boolean;
  /** System roles the viewer holds in the effective (host-resolved) org. */
  roles: MemberRole[];
}

const EMPTY: ViewerContext = { profileId: null, isSuperAdmin: false, roles: [] };

/**
 * SE5a — resolve the logged viewer's RBAC context for Marketplace visibility.
 *
 * Roles come from the live RBAC (getActor → membership in the effective org),
 * replacing the inert post-Fase-3 placeholder. Anonymous (no session) or no org
 * context → empty roles, so only unrestricted scopes are visible. super_admin
 * is surfaced so scopeMatchesViewer can let it see everything (system-wide
 * bypass, mirroring requireOrgRole).
 *
 * `orgId` is the effective org (proxy x-org-id via getOrgIdFromRequest), the
 * same tenant SE3/SE4 scope by — so roles are checked in the org being viewed.
 */
export async function getViewerContext(
  session: Session | null,
  orgId: string | null
): Promise<ViewerContext> {
  if (!session?.user) return EMPTY;

  const actor = await getActor(session);
  if (!actor) return { ...EMPTY, profileId: session.user.id ?? null };

  if (actor.isSuperAdmin) {
    return { profileId: actor.profileId, isSuperAdmin: true, roles: [] };
  }

  if (!orgId) return { profileId: actor.profileId, isSuperAdmin: false, roles: [] };

  const membership = actor.memberships.find((m) => m.organizationId === orgId);
  // r.role is nullable post-Fase-5 (custom-role rows carry roleId, not a system
  // role). Section gating is by system MemberRole only — drop the nulls.
  const roles = membership
    ? membership.roles
        .map((r) => r.role)
        .filter((r): r is MemberRole => r !== null)
    : [];
  return { profileId: actor.profileId, isSuperAdmin: false, roles };
}
