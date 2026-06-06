import { redirect } from "next/navigation";
import { connection } from "next/server";
import { requireOrgRole } from "@/lib/permissions";
import { RolesManager } from "@/components/organization/roles-manager";

/**
 * Custom roles management (R&P Fase 7c-1). OWNER/ADMIN may view (roles.read =
 * O_A); MEMBER is bounced. The OWNER-only mutation gate is finer and lives
 * client-side (useViewerPermissions). The page only consumes the Fase 5 /roles
 * endpoints — no server data fetch here.
 */
export default async function RolesPage() {
  await connection();

  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) redirect("/admin");

  return <RolesManager />;
}
