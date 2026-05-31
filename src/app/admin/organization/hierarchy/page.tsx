import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { getDescendants } from "@/lib/org-hierarchy";
import { prisma } from "@/lib/prisma";
import { OrgHierarchyClient } from "@/components/organization/org-hierarchy-client";

/**
 * Sub-26.4a — página da hierarquia de organizações (server component).
 *
 * Resolve a org ativa (host → JWT fallback), lê a raiz + descendentes
 * (organizations não é tenant-scoped → sem withTenant) e entrega ao client.
 * Sem org ativa → árvore vazia (nunca consultar sem contexto).
 *
 * `OrgHierarchyClient` usa `useSearchParams()` → DEVE ficar dentro de um
 * `<Suspense>` boundary (Next 16 + cacheComponents). Sem o boundary, o client
 * de-opta/crasha na hidratação e a UI fica morta (padrão: tasks/page.tsx).
 */
async function HierarchyContent() {
  const session = await auth();
  const orgId =
    (await getOrgIdFromRequest()) ?? session?.user?.activeOrgId ?? null;

  if (!orgId) {
    return <OrgHierarchyClient root={{ id: "", name: "" }} descendants={[]} />;
  }

  const [root, descendants] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { id: true, name: true } }),
    getDescendants(orgId),
  ]);

  return (
    <OrgHierarchyClient
      root={root ?? { id: orgId, name: "" }}
      descendants={descendants}
    />
  );
}

export default async function OrgHierarchyPage() {
  await connection();
  return (
    <Suspense>
      <HierarchyContent />
    </Suspense>
  );
}
