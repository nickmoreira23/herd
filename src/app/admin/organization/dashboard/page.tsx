import { connection } from "next/server";
import { Building2, MapPin, Users, Network } from "lucide-react";
import { auth } from "@/lib/auth";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { getDescendants } from "@/lib/org-hierarchy";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenancy/context";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/t";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

/**
 * Sub-26.4b — dashboard consolidado (server-page-direct, read-only).
 *
 * Mostra a org ativa + descendentes com contagens por org (departments,
 * locations, members). Agregação inline via groupBy sob leitura vertical (26.2)
 * + getDescendants (26.1). Zero endpoint API, zero RLS/migration.
 *
 * Invariante cravada: as LINHAS vêm de getDescendants (lista completa de orgs);
 * o groupBy só PREENCHE os números, com default 0 nas orgs sem rows. Nunca
 * montar linhas a partir do groupBy — uma org vazia sumiria do dashboard.
 *
 * Os groupBys tenant-scoped (dept/loc) rodam SEQUENCIAIS dentro de withTenant
 * (não Promise.all) — evita a concorrência na conexão pg (tech-debt #95).
 */
export default async function OrgDashboardPage() {
  await connection();
  const locale = await getLocale();
  const session = await auth();
  const orgId =
    (await getOrgIdFromRequest()) ?? session?.user?.activeOrgId ?? null;

  if (!orgId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t("organization.dashboard.title", locale)}
          description={t("organization.dashboard.description", locale)}
        />
        <p className="text-sm text-muted-foreground">
          {t("organization.dashboard.empty", locale)}
        </p>
      </div>
    );
  }

  const [root, descendants] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { id: true, name: true } }),
    getDescendants(orgId),
  ]);

  // SOURCE OF TRUTH for rows = the full org list (self + descendants).
  const orgList = [
    { id: orgId, name: root?.name ?? "", depth: 0 },
    ...descendants.map((d) => ({ id: d.id, name: d.name, depth: d.depth })),
  ];
  const subtreeIds = orgList.map((o) => o.id);

  // Tenant-scoped counts: SEQUENTIAL inside withTenant (no Promise.all → no pg
  // concurrency warning). Each groupBy returns one row per org that HAS rows.
  const [deptGroups, locGroups] = await withTenant(orgId, async () => {
    const dept = await prisma.department.groupBy({ by: ["tenantId"], _count: { _all: true } });
    const loc = await prisma.location.groupBy({ by: ["tenantId"], _count: { _all: true } });
    return [dept, loc] as const;
  });

  // Non-tenant-scoped (members) — scoped by organizationId IN subtree, no withTenant.
  const memberGroups = await prisma.organizationMember.groupBy({
    by: ["organizationId"],
    where: { organizationId: { in: subtreeIds }, status: "ACTIVE" },
    _count: { _all: true },
  });

  const byTenant = (groups: { tenantId: string; _count: { _all: number } }[]) =>
    Object.fromEntries(groups.map((g) => [g.tenantId, g._count._all]));
  const deptBy = byTenant(deptGroups as never);
  const locBy = byTenant(locGroups as never);
  const memberBy = Object.fromEntries(
    memberGroups.map((g) => [g.organizationId, g._count._all]),
  );

  // Rows from the full list; numbers filled with default 0.
  const rows = orgList.map((o) => ({
    ...o,
    departments: deptBy[o.id] ?? 0,
    locations: locBy[o.id] ?? 0,
    members: memberBy[o.id] ?? 0,
  }));

  const totals = rows.reduce(
    (acc, r) => ({
      departments: acc.departments + r.departments,
      locations: acc.locations + r.locations,
      members: acc.members + r.members,
    }),
    { departments: 0, locations: 0, members: 0 },
  );

  const cards = [
    { label: t("organization.dashboard.total_orgs", locale), value: orgList.length, icon: Network },
    { label: t("organization.dashboard.total_departments", locale), value: totals.departments, icon: Building2 },
    { label: t("organization.dashboard.total_locations", locale), value: totals.locations, icon: MapPin },
    { label: t("organization.dashboard.total_members", locale), value: totals.members, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("organization.dashboard.title", locale)}
        description={t("organization.dashboard.description", locale)}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5">
                <c.icon className="h-3.5 w-3.5" />
                {c.label}
              </CardDescription>
              <CardTitle className="text-2xl">{c.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("organization.dashboard.col_org", locale)}</TableHead>
              <TableHead className="text-right">{t("organization.dashboard.col_departments", locale)}</TableHead>
              <TableHead className="text-right">{t("organization.dashboard.col_locations", locale)}</TableHead>
              <TableHead className="text-right">{t("organization.dashboard.col_members", locale)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell style={{ paddingLeft: `${r.depth * 20 + 16}px` }}>
                  <span className="font-medium">{r.name}</span>
                </TableCell>
                <TableCell className="text-right">{r.departments}</TableCell>
                <TableCell className="text-right">{r.locations}</TableCell>
                <TableCell className="text-right">{r.members}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {descendants.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t("organization.dashboard.leaf_hint", locale)}
        </p>
      )}
    </div>
  );
}
