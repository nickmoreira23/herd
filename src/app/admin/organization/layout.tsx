import { redirect } from "next/navigation";
import { requireOrgRole, getActor } from "@/lib/permissions";
import { resolveViewerPermissions } from "@/lib/permissions/resolve-viewer-permissions";
import { PermissionProvider } from "@/lib/permissions/permission-context";

/**
 * Membership guard for the entire Organization admin area (Fix-2).
 *
 * Pages under /admin/organization render host-org data via
 * `withTenant(x-org-id)` (departments, locations, profile, brand-kit, …). The
 * RLS isolates by the HOST's tenant, but nothing verified the *viewer* belongs
 * to that tenant — so any logged-in user could read another org's data via
 * `{other-org}.comecaai.com.br`. Isolation was host-scoped, not membership-scoped.
 *
 * This single guard closes the whole area in one point, mirroring the check
 * members/page.tsx and permissions/page.tsx already perform: require an ACTIVE
 * membership in the effective (host-resolved) org. super_admin bypasses
 * automatically (inherited from requireOrgRole → getActor).
 *
 * Defense-in-depth: the per-page guards on members/permissions are left intact.
 */
export default async function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN", "MEMBER"]);
  if (sessionOrResponse instanceof Response) redirect("/login");
  const session = sessionOrResponse;

  // R&P Fase 7a — seed the client permission provider from the server (single
  // source = the resolved matrix). INERT: nothing consumes useCan yet (that is
  // 7b); this only makes the allow-set available at first paint (no fetch/flicker).
  const orgId = session.user.activeOrgId;
  const actor = orgId ? await getActor(session) : null;
  const viewerPermissions =
    orgId && actor
      ? await resolveViewerPermissions(orgId, actor)
      : {
          allowSet: [],
          orgRole: null,
          isSuperAdmin: (session.user as { isSuperAdmin?: boolean }).isSuperAdmin === true,
        };

  return <PermissionProvider value={viewerPermissions}>{children}</PermissionProvider>;
}
