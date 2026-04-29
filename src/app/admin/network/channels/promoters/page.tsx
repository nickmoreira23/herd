import { prisma } from "@/lib/prisma";
import { CommissionPageClient } from "@/components/network/promoters/commission-page-client";
import { toNumber } from "@/lib/utils";
import { connection } from "next/server";

export default async function CommissionsPage() {
  await connection();
  const [structures, tiers, plans, d2dPartners, agreements, ledgerSummary] = await Promise.all([
    // Legacy structures (for simulator backward compat)
    prisma.commissionStructure.findMany({
      orderBy: { createdAt: "desc" },
      include: { tierRates: { include: { subscriptionTier: true } } },
    }),
    prisma.subscriptionTier.findMany({ orderBy: { sortOrder: "asc" } }),
    // New commission plans
    prisma.commissionPlan.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: {
        planRates: { include: { subscriptionTier: true } },
        overrideRules: true,
        performanceTiers: { orderBy: { sortOrder: "asc" } },
        _count: { select: { agreements: true } },
      },
    }),
    // D2D Partners with org trees
    prisma.d2DPartner.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orgNodes: { orderBy: { createdAt: "asc" } },
        agreements: { include: { commissionPlan: true } },
        _count: { select: { orgNodes: true, agreements: true } },
      },
    }),
    // Partner agreements
    prisma.partnerAgreement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        partner: true,
        commissionPlan: true,
        clawbackRules: { orderBy: { windowDays: "asc" } },
        _count: { select: { ledgerEntries: true } },
      },
    }),
    // Ledger summary
    Promise.all([
      prisma.commissionLedgerEntry.aggregate({ where: { entryType: "EARNED" }, _sum: { amount: true }, _count: true }),
      prisma.commissionLedgerEntry.aggregate({ where: { entryType: "HELD" }, _sum: { amount: true }, _count: true }),
      prisma.commissionLedgerEntry.aggregate({ where: { entryType: "RELEASED" }, _sum: { amount: true }, _count: true }),
      prisma.commissionLedgerEntry.aggregate({ where: { entryType: "CLAWED_BACK" }, _sum: { amount: true }, _count: true }),
      prisma.commissionLedgerEntry.count(),
    ]).then(([earned, held, released, clawedBack, total]) => ({
      totalEntries: total,
      earned: { count: earned._count, total: Number(earned._sum.amount ?? 0) },
      held: { count: held._count, total: Number(held._sum.amount ?? 0) },
      released: { count: released._count, total: Number(released._sum.amount ?? 0) },
      clawedBack: { count: clawedBack._count, total: Number(clawedBack._sum.amount ?? 0) },
    })),
  ]);

  // Serialize Decimals — helper
  const num = (v: unknown) => (v != null ? toNumber(v as number) : null);

  const serializedStructures = structures.map((s) => ({
    ...s,
    residualPercent: num(s.residualPercent),
    tierRates: s.tierRates.map((r) => ({
      ...r,
      flatBonusAmount: num(r.flatBonusAmount),
      acceleratorThreshold: num(r.acceleratorThreshold),
      acceleratorMultiplier: num(r.acceleratorMultiplier),
      subscriptionTier: {
        ...r.subscriptionTier,
        monthlyPrice: num(r.subscriptionTier.monthlyPrice),
        quarterlyPrice: num(r.subscriptionTier.quarterlyPrice),
        annualPrice: num(r.subscriptionTier.annualPrice),
        monthlyCredits: num(r.subscriptionTier.monthlyCredits),
        partnerDiscountPercent: num(r.subscriptionTier.partnerDiscountPercent),
        apparelBudget: num(r.subscriptionTier.apparelBudget),
      },
    })),
  }));

  const serializedTiers = tiers.map((t) => ({
    ...t,
    monthlyPrice: num(t.monthlyPrice),
    quarterlyPrice: num(t.quarterlyPrice),
    annualPrice: num(t.annualPrice),
    monthlyCredits: num(t.monthlyCredits),
    partnerDiscountPercent: num(t.partnerDiscountPercent),
    apparelBudget: num(t.apparelBudget),
  }));

  const serializedPlans = plans.map((p) => ({
    ...p,
    residualPercent: num(p.residualPercent),
    planRates: p.planRates.map((r) => ({
      ...r,
      upfrontBonus: num(r.upfrontBonus),
      residualPercent: num(r.residualPercent),
      subscriptionTier: { id: r.subscriptionTier.id, name: r.subscriptionTier.name },
    })),
    overrideRules: p.overrideRules.map((r) => ({ ...r, overrideValue: num(r.overrideValue) })),
    performanceTiers: p.performanceTiers.map((t) => ({
      ...t,
      bonusMultiplier: num(t.bonusMultiplier),
      bonusFlat: num(t.bonusFlat),
    })),
  }));

  const serializedAgreements = agreements.map((a) => ({
    ...a,
    clawbackRules: a.clawbackRules.map((r) => ({ ...r, clawbackPercent: num(r.clawbackPercent) })),
    commissionPlan: { id: a.commissionPlan.id, name: a.commissionPlan.name, version: a.commissionPlan.version },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Promoters</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage door-to-door promoter commissions — plans, org trees, agreements, and payout tracking.
        </p>
      </div>
      <CommissionPageClient
        tiers={serializedTiers as never}
        plans={serializedPlans as never}
        d2dPartners={d2dPartners as never}
        agreements={serializedAgreements as never}
        ledgerSummary={ledgerSummary}
        initialStructures={serializedStructures as never}
      />
    </div>
  );
}
