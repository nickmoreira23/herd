import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const [earned, held, released, clawedBack, total] = await Promise.all([
      prisma.commissionLedgerEntry.aggregate({ where: { entryType: "EARNED" }, _sum: { amount: true }, _count: true }),
      prisma.commissionLedgerEntry.aggregate({ where: { entryType: "HELD" }, _sum: { amount: true }, _count: true }),
      prisma.commissionLedgerEntry.aggregate({ where: { entryType: "RELEASED" }, _sum: { amount: true }, _count: true }),
      prisma.commissionLedgerEntry.aggregate({ where: { entryType: "CLAWED_BACK" }, _sum: { amount: true }, _count: true }),
      prisma.commissionLedgerEntry.count(),
    ]);

    return apiSuccess({
      totalEntries: total,
      earned: { count: earned._count, total: Number(earned._sum.amount ?? 0) },
      held: { count: held._count, total: Number(held._sum.amount ?? 0) },
      released: { count: released._count, total: Number(released._sum.amount ?? 0) },
      clawedBack: { count: clawedBack._count, total: Number(clawedBack._sum.amount ?? 0) },
    });
  } catch (e) {
    console.error("GET /api/commission-ledger/summary error:", e);
    return apiError("Failed to fetch ledger summary", 500);
  }
}
