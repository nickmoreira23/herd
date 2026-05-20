import { prisma } from "@/lib/prisma";
import { toNumber, formatCurrency } from "@/lib/utils";
import { calculateBlendedRevenue } from "@/lib/financial-engine";
import { Badge } from "@/components/ui/badge";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/page-header";

export default async function DashboardPage() {
  await connection();
  // CommissionStructure removed in Sub-etapa 3.5 — dashboard's "Active
  // Commission Structure" card is collapsed until new commission feature
  // lands post-Fase 3.
  // PartnerBrand dropped in Sub-etapa 3.5.5 — partner stats card removed.
  const [
    productCount,
    activeProducts,
    tiers,
    snapshotCount,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.subscriptionTier.findMany({
      orderBy: { sortOrder: "asc" },
    }),
    prisma.financialSnapshot.count(),
  ]);

  const billing = { monthly: 60, biannual: 25, annual: 15 };

  const tierSummaries = tiers.map((t) => {
    const monthly = toNumber(t.monthlyPrice);
    // `biannualPrice` and `annualPrice` are already the discounted
    // per-month rate the customer pays — no division needed.
    const biannual = toNumber(t.biannualPrice);
    const annual = toNumber(t.annualPrice);
    const blended = calculateBlendedRevenue(monthly, biannual, annual, billing);
    const credits = toNumber(t.monthlyCredits);
    return {
      name: t.name,
      monthlyPrice: monthly,
      blendedRevenue: blended,
      credits,
      isFeatured: t.isFeatured,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="HERD OS overview — key metrics across your subscription business."
      />

      {/* Top-level stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Products" value={String(activeProducts)} sub={`${productCount} total`} />
        <StatCard label="Plans" value={String(tiers.length)} />
        <StatCard label="Saved Scenarios" value={String(snapshotCount)} />
      </div>

      {/* Tier Overview */}
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Plans</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {tierSummaries.map((t) => (
            <div key={t.name} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{t.name}</h4>
                {t.isFeatured && (
                  <Badge className="bg-[#FF0000] text-black text-xs">Featured</Badge>
                )}
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly</span>
                  <span className="font-medium">{formatCurrency(t.monthlyPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blended Rev</span>
                  <span className="font-medium">{formatCurrency(t.blendedRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credits</span>
                  <span className="font-medium">{formatCurrency(t.credits)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <QuickLink href="/admin/blocks/products" label="Manage Products" description="Edit catalog, prices, and COGS" />
        <QuickLink href="/admin/blocks/subscriptions" label="Plans" description="Design pricing and credit allocations" />
        <QuickLink href="/admin/blocks/perks" label="Perks" description="Manage subscription perks" />
        <QuickLink href="/admin/operation/finances" label="Finances" description="Projections and payments" />
        <QuickLink href="/admin/settings" label="Settings" description="System-wide configuration" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function QuickLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="rounded-lg border p-4 hover:bg-muted/50 transition-colors block"
    >
      <p className="font-medium text-sm">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </a>
  );
}
