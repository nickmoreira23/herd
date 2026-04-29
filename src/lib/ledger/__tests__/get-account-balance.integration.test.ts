import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { money } from "@/lib/money";
import { postJournalEntry } from "../post-journal-entry";
import { buildBalancedEntry } from "../build-balanced-entry";
import { getAccountBalance } from "../get-account-balance";
import { AccountNotFoundError } from "../errors";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL must be set for integration tests");
}
const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

// Two seed entries are posted with explicit, fixed `postedAt` values so that
// asOf-based assertions are deterministic regardless of clock skew or CI speed.
// See src/lib/ledger/__tests__/README.md ("Tempo em testes de integração").
const earlierPosted = new Date("2024-01-15T10:00:00.000Z");
const laterPosted = new Date("2024-06-15T10:00:00.000Z");

describe("getAccountBalance — integration", () => {
  let assetCode: string;
  let revenueCode: string;
  let liabilityCode: string;
  let expenseCode: string;
  let equityCode: string;
  let untouchedAssetCode: string;

  beforeAll(async () => {
    const suffix = Date.now().toString(36);
    assetCode = `test:bal:asset:${suffix}`;
    revenueCode = `test:bal:rev:${suffix}`;
    liabilityCode = `test:bal:liab:${suffix}`;
    expenseCode = `test:bal:exp:${suffix}`;
    equityCode = `test:bal:eq:${suffix}`;
    untouchedAssetCode = `test:bal:untouched:${suffix}`;

    await prisma.account.create({ data: { code: assetCode, name: "Asset", accountType: "ASSET", ownerKind: "PLATFORM", currency: "BRL" } });
    await prisma.account.create({ data: { code: revenueCode, name: "Revenue", accountType: "REVENUE", ownerKind: "PLATFORM", currency: "BRL" } });
    await prisma.account.create({ data: { code: liabilityCode, name: "Liab", accountType: "LIABILITY", ownerKind: "PLATFORM", currency: "BRL" } });
    await prisma.account.create({ data: { code: expenseCode, name: "Expense", accountType: "EXPENSE", ownerKind: "PLATFORM", currency: "BRL" } });
    await prisma.account.create({ data: { code: equityCode, name: "Equity", accountType: "EQUITY", ownerKind: "PLATFORM", currency: "BRL" } });
    await prisma.account.create({ data: { code: untouchedAssetCode, name: "Untouched", accountType: "ASSET", ownerKind: "PLATFORM", currency: "BRL" } });

    // First post: cash inflow — backdated to earlierPosted.
    // assetCode: D 10000; revenueCode: C 10000.
    await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        postedAt: earlierPosted,
        lines: buildBalancedEntry({
          debits: [{ accountCode: assetCode, amount: money(10000n, "BRL") }],
          credits: [{ accountCode: revenueCode, amount: money(10000n, "BRL") }],
        }),
      },
      prisma,
    );

    // Second post: cash outflow — backdated to laterPosted.
    // expenseCode: D 3000; assetCode: C 3000.
    await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        postedAt: laterPosted,
        lines: buildBalancedEntry({
          debits: [{ accountCode: expenseCode, amount: money(3000n, "BRL") }],
          credits: [{ accountCode: assetCode, amount: money(3000n, "BRL") }],
        }),
      },
      prisma,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns zero balance for never-used account", async () => {
    const result = await getAccountBalance(untouchedAssetCode, undefined, prisma);
    expect(result.balance.amountCents).toBe(0n);
    expect(result.rawDebits.amountCents).toBe(0n);
    expect(result.rawCredits.amountCents).toBe(0n);
    expect(result.lineCount).toBe(0);
  });

  it("ASSET: aggregates seeded debit and credit → balance = D - C", async () => {
    const result = await getAccountBalance(assetCode, undefined, prisma);
    expect(result.rawDebits.amountCents).toBe(10000n);
    expect(result.rawCredits.amountCents).toBe(3000n);
    expect(result.balance.amountCents).toBe(7000n); // ASSET: D - C
    expect(result.lineCount).toBe(2);
  });

  it("REVENUE: positive balance when credits > debits", async () => {
    const result = await getAccountBalance(revenueCode, undefined, prisma);
    expect(result.balance.amountCents).toBe(10000n); // REVENUE: C - D
  });

  it("respects asOf cutoff (excludes entries posted after the cutoff)", async () => {
    // Cutoff between earlierPosted (Jan) and laterPosted (Jun) — only the
    // earlier entry is included.
    const between = new Date("2024-03-15T10:00:00.000Z");
    const result = await getAccountBalance(assetCode, between, prisma);
    // Only the first seed entry (10000 D on assetCode) is in scope.
    expect(result.rawDebits.amountCents).toBe(10000n);
    expect(result.rawCredits.amountCents).toBe(0n);
    expect(result.balance.amountCents).toBe(10000n);
    expect(result.lineCount).toBe(1);
  });

  it("returns balance in the account's currency", async () => {
    const result = await getAccountBalance(assetCode, undefined, prisma);
    expect(result.balance.currency).toBe("BRL");
  });

  it("throws AccountNotFoundError for missing account", async () => {
    await expect(getAccountBalance("does:not:exist", undefined, prisma)).rejects.toBeInstanceOf(AccountNotFoundError);
  });

  it("includes account info in response", async () => {
    const result = await getAccountBalance(assetCode, undefined, prisma);
    expect(result.account.code).toBe(assetCode);
    expect(result.account.accountType).toBe("ASSET");
    expect(result.account.currency).toBe("BRL");
  });

  // liabilityCode and equityCode are kept in beforeAll so the polarity coverage
  // is exercised against a real DB even though their balances are tested only
  // by the pure account-polarity.test.ts suite.
  it("EQUITY: zero balance on creation", async () => {
    const result = await getAccountBalance(equityCode, undefined, prisma);
    expect(result.balance.amountCents).toBe(0n);
  });

  it("LIABILITY: zero balance on creation", async () => {
    const result = await getAccountBalance(liabilityCode, undefined, prisma);
    expect(result.balance.amountCents).toBe(0n);
  });
});
