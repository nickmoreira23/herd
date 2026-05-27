/**
 * Sub-etapa 22.2 — Org selector page (/orgs).
 *
 * Apex-only page shown to authenticated users with multiple org memberships.
 * Proxy auth gate ensures only logged-in users reach this route.
 *
 * RSC: fetches memberships server-side and passes serializable data to OrgList.
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrgList } from "./org-list";

export default async function OrgsPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const memberships = await prisma.organizationMember.findMany({
    where: { networkProfileId: userId, status: "ACTIVE" },
    include: {
      organization: {
        select: { id: true, name: true, subdomain: true, status: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const activeOrgs = memberships
    .filter((m) => m.organization.status === "ACTIVE")
    .map((m) => ({
      orgId: m.organization.id,
      name: m.organization.name,
      subdomain: m.organization.subdomain,
    }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-brand mb-2">ComeçaAI</div>
          <p className="text-zinc-400 text-sm">Escolha a organização</p>
        </div>
        <OrgList orgs={activeOrgs} />
      </div>
    </div>
  );
}
