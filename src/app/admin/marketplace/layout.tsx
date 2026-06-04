import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

/**
 * Guard for the Marketplace admin area (Fix-3).
 *
 * Marketplace section pages render host-org data via withTenant(x-org-id)
 * without a viewer check (same leak class Fix-2 closed). The role here is
 * super_admin — NOT requireOrgRole — because the section write APIs are
 * currently requireSuperAdmin (SE-1 interim): the marketplace is
 * platform-curated today.
 *
 * super_admin-only até SE-4 (per-tenant RBAC do marketplace); migrar pra
 * requireOrgRole quando SE-4 landar.
 */
export default async function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionOrResponse = await requireSuperAdmin();
  if (sessionOrResponse instanceof Response) redirect("/login");

  return <>{children}</>;
}
