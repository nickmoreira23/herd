import { prisma } from "@/lib/prisma";
import { LedgerTab } from "@/components/network/promoters/tabs/ledger-tab";

export default async function PaymentsPage() {
  const [earned, held, released, clawedBack, total, partners] = await Promise.all([
    prisma.commissionLedgerEntry.aggregate({ where: { entryType: "EARNED" }, _sum: { amount: true }, _count: true }),
    prisma.commissionLedgerEntry.aggregate({ where: { entryType: "HELD" }, _sum: { amount: true }, _count: true }),
    prisma.commissionLedgerEntry.aggregate({ where: { entryType: "RELEASED" }, _sum: { amount: true }, _count: true }),
    prisma.commissionLedgerEntry.aggregate({ where: { entryType: "CLAWED_BACK" }, _sum: { amount: true }, _count: true }),
    prisma.commissionLedgerEntry.count(),
    prisma.d2DPartner.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const ledgerSummary = {
    totalEntries: total,
    earned: { count: earned._count, total: Number(earned._sum.amount ?? 0) },
    held: { count: held._count, total: Number(held._sum.amount ?? 0) },
    released: { count: released._count, total: Number(released._sum.amount ?? 0) },
    clawedBack: { count: clawedBack._count, total: Number(clawedBack._sum.amount ?? 0) },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Commission payment ledger — every earned, held, released, and clawed-back entry across all partners and reps.
        </p>
      </div>
      <LedgerTab initialSummary={ledgerSummary} partners={partners} />
    </div>
  );
}
