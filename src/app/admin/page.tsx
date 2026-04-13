import { prisma } from "@/lib/prisma";
import { toNumber, formatCurrency, formatPercent } from "@/lib/utils";
import { calculateBlendedRevenue } from "@/lib/financial-engine";
import { Badge } from "@/components/ui/badge";
import { connection } from "next/server";

export default async function DashboardPage() {
  await connection();
  const [
    productCount,
    activeProducts,
    tiers,
    activeCommission,
    partnerCount,
    activePartners,
    snapshotCount,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.subscriptionTier.findMany({
      orderBy: { sortOrder: "asc" },
      include: { commissionTierRates: true, partnerAssignments: true },
    }),
    prisma.commissionStructure.findFirst({
      where: { isActive: true },
      include: { tierRates: true },
    }),
    prisma.partnerBrand.count(),
    prisma.partnerBrand.count({ where: { isActive: true } }),
    prisma.financialSnapshot.count(),
  ]);

  const billing = { monthly: 60, quarterly: 25, annual: 15 };

  const tierSummaries = tiers.map((t) => {
    const monthly = toNumber(t.monthlyPrice);
    const quarterly = toNumber(t.quarterlyPrice) / 3;
    const annual = toNumber(t.annualPrice) / 12;
    const blended = calculateBlendedRevenue(monthly, quarterly, annual, billing);
    const credits = toNumber(t.monthlyCredits);
    return {
      name: t.name,
      monthlyPrice: monthly,
      blendedRevenue: blended,
      credits,
      partnerAssignments: t.partnerAssignments.length,
      commissionRates: t.commissionTierRates.length,
      isFeatured: t.isFeatured,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          HERD OS overview — key metrics across your subscription business.
        </p>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Products" value={String(activeProducts)} sub={`${productCount} total`} />
        <StatCard label="Plans" value={String(tiers.length)} />
        <StatCard label="Partners" value={String(activePartners)} sub={`${partnerCount} total`} />
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Partners</span>
                  <span>{t.partnerAssignments}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Structure */}
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Active Commission Structure</h3>
        {activeCommission ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{activeCommission.name}</span>
              <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Residual</span>
                <p className="font-medium">{formatPercent(toNumber(activeCommission.residualPercent))}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Clawback Window</span>
                <p className="font-medium">{activeCommission.clawbackWindowDays} days</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tier Rates</span>
                <p className="font-medium">{activeCommission.tierRates.length} configured</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active commission structure.</p>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <QuickLink href="/admin/blocks/products" label="Manage Products" description="Edit catalog, prices, and COGS" />
        <QuickLink href="/admin/tiers" label="Plans" description="Design pricing and credit allocations" />
        <QuickLink href="/admin/network/promoters" label="Promoters" description="Configure sales team compensation" />
        <QuickLink href="/admin/blocks/partners" label="Partners" description="Manage brand partnerships" />
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
