import { redirect } from "next/navigation";
import { requireOrgRole } from "@/lib/permissions";

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

  // R&P Fase 7b — the permission provider moved UP to admin/layout.tsx (it must
  // wrap the nav/AdminShell, which lives above this org layout). This layout keeps
  // only the membership guard; no provider seed here (avoids a double provider).
  return <>{children}</>;
}
