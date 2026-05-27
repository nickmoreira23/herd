/**
 * Sub-etapa 22.2 — Login page refactored to async RSC.
 *
 * Reads `x-host` (injected by proxy.ts) server-side and queries the DB for
 * the org name to show branded login (D3). Falls back to "ComeçaAI" on apex
 * or unresolved hosts. Delegates all client interaction to LoginForm.
 */

import { headers } from "next/headers";
import { resolveOrgByHost } from "@/lib/tenant/org-resolver";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const headersList = await headers();
  const host =
    headersList.get("x-host") ??
    headersList.get("host")?.split(":")[0] ??
    "";

  let orgName = "ComeçaAI";
  if (host) {
    const orgId = await resolveOrgByHost(host);
    if (orgId) {
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true },
      });
      if (org) orgName = org.name;
    }
  }

  const params = await searchParams;

  return <LoginForm orgName={orgName} errorParam={params.error} />;
}
