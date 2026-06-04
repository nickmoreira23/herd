import { redirect } from "next/navigation";
import { requireOrgRole } from "@/lib/permissions";

/**
 * Membership guard for the Blocks admin area (Fix-3).
 *
 * Blocks are the org's operational data (contacts, deals, products, locations,
 * …); some pages render host-org data via withTenant(x-org-id) without checking
 * viewer membership (same host-scoped-not-membership-scoped leak Fix-2 closed
 * for /admin/organization). This single guard requires an ACTIVE membership in
 * the effective (host-resolved) org. super_admin bypasses (inherited from
 * requireOrgRole → getActor). Per-page guards, if any, are left intact.
 */
export default async function BlocksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN", "MEMBER"]);
  if (sessionOrResponse instanceof Response) redirect("/login");

  return <>{children}</>;
}
