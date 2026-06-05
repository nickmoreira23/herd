import { redirect } from "next/navigation";
import { requireOrgRole } from "@/lib/permissions";

/**
 * Org-scoped guard for the Marketplace admin area (SE-4).
 *
 * Marketplace section pages render host-org data via withTenant(x-org-id).
 * Curating the storefront is an admin-level action, so this requires OWNER or
 * ADMIN in the effective (host-resolved) org — intentionally stricter than the
 * Blocks area (which also allows MEMBER). super_admin bypasses (inherited from
 * requireOrgRole → getActor). The section write APIs enforce the same roles.
 */
export default async function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) redirect("/login");

  return <>{children}</>;
}
