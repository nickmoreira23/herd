import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { money } from "@/lib/money";
import { postJournalEntry } from "../post-journal-entry";
import { buildBalancedEntry } from "../build-balanced-entry";
import { reverseJournalEntry } from "../reverse-journal-entry";
import { findReversalsOf } from "../find-reversals-of";
import { getAccountBalance } from "../get-account-balance";
import { getEntryDetails } from "../get-entry-details";
import {
  EntryNotFoundError,
  CannotReverseReversalError,
  EntryAlreadyReversedError,
  MissingReversalReasonError,
  IdempotencyConflictError,
} from "../errors";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL must be set for integration tests");
}
const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

describe("reverseJournalEntry — integration", () => {
  let assetCode: string;
  let revenueCode: string;
  let liabilityCode: string;
  // Fixed timestamps for deterministic tests (anti-flake convention from 1.4).
  const originalPosted = new Date("2024-01-15T10:00:00.000Z");
  const reversalPosted = new Date("2024-01-20T10:00:00.000Z");

  beforeAll(async () => {
    const suffix = Date.now().toString(36);
    assetCode = `test:rev:asset:${suffix}`;
    revenueCode = `test:rev:revenue:${suffix}`;
    liabilityCode = `test:rev:liab:${suffix}`;

    await prisma.account.create({ data: { code: assetCode, name: "Reversal Asset", accountType: "ASSET", ownerKind: "PLATFORM", currency: "BRL" } });
    await prisma.account.create({ data: { code: revenueCode, name: "Reversal Revenue", accountType: "REVENUE", ownerKind: "PLATFORM", currency: "BRL" } });
    await prisma.account.create({ data: { code: liabilityCode, name: "Reversal Liab", accountType: "LIABILITY", ownerKind: "PLATFORM", currency: "BRL" } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("reverses a balanced entry — net effect on accounts is zero", async () => {
    const original = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        postedAt: originalPosted,
        description: "test original",
        lines: buildBalancedEntry({
          debits: [{ accountCode: assetCode, amount: money(10000n, "BRL") }],
          credits: [{ accountCode: revenueCode, amount: money(10000n, "BRL") }],
        }),
      },
      prisma,
    );

    const reversal = await reverseJournalEntry(
      original.id,
      { reason: "test reversal: incorrect amount", postedAt: reversalPosted },
      prisma,
    );

    expect(reversal.id).not.toBe(original.id);
    expect(reversal.sourceKind).toBe("REVERSAL");
    expect(reversal.sourceId).toBe(original.id);
    expect(reversal.description).toBe("test reversal: incorrect amount");

    const assetBalance = await getAccountBalance(assetCode, undefined, prisma);
    const revenueBalance = await getAccountBalance(revenueCode, undefined, prisma);
    expect(assetBalance.balance.amountCents).toBe(0n);
    expect(revenueBalance.balance.amountCents).toBe(0n);

    const originalDetails = await getEntryDetails(original.id, prisma);
    expect(originalDetails.description).toBe("test original");
    expect(originalDetails.sourceKind).toBe("MANUAL_ADJUSTMENT");
  });

  it("inverts directions: D becomes C, C becomes D", async () => {
    const original = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        postedAt: new Date("2024-02-01T10:00:00.000Z"),
        lines: buildBalancedEntry({
          debits: [{ accountCode: assetCode, amount: money(5000n, "BRL") }],
          credits: [{ accountCode: liabilityCode, amount: money(5000n, "BRL") }],
        }),
      },
      prisma,
    );

    const reversal = await reverseJournalEntry(
      original.id,
      { reason: "test inversion", postedAt: new Date("2024-02-02T10:00:00.000Z") },
      prisma,
    );

    const reversalDetails = await getEntryDetails(reversal.id, prisma);
    const reversalAssetLine = reversalDetails.lines.find((l) => l.account.code === assetCode);
    const reversalLiabLine = reversalDetails.lines.find((l) => l.account.code === liabilityCode);

    expect(reversalAssetLine?.direction).toBe("C");
    expect(reversalLiabLine?.direction).toBe("D");
    expect(reversalAssetLine?.amount.amountCents).toBe(5000n);
    expect(reversalLiabLine?.amount.amountCents).toBe(5000n);
  });

  it("preserves audit trail in metadata", async () => {
    const original = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        postedAt: new Date("2024-03-01T10:00:00.000Z"),
        lines: buildBalancedEntry({
          debits: [{ accountCode: assetCode, amount: money(100n, "BRL") }],
          credits: [{ accountCode: revenueCode, amount: money(100n, "BRL") }],
        }),
      },
      prisma,
    );

    const reversal = await reverseJournalEntry(
      original.id,
      {
        reason: "audit-test reason",
        postedAt: new Date("2024-03-02T10:00:00.000Z"),
        metadata: { caller: "test-suite" },
      },
      prisma,
    );

    const details = await getEntryDetails(reversal.id, prisma);
    const reversalMeta = details.metadata.reversal as Record<string, unknown> | undefined;
    expect(reversalMeta).toBeDefined();
    expect(reversalMeta?.reason).toBe("audit-test reason");
    expect(reversalMeta?.originalEntryId).toBe(original.id);
    expect(reversalMeta?.originalSourceKind).toBe("MANUAL_ADJUSTMENT");
    expect(details.metadata.caller).toBe("test-suite");
  });

  it("findReversalsOf returns the reversal entry", async () => {
    const original = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        postedAt: new Date("2024-04-01T10:00:00.000Z"),
        lines: buildBalancedEntry({
          debits: [{ accountCode: assetCode, amount: money(200n, "BRL") }],
          credits: [{ accountCode: revenueCode, amount: money(200n, "BRL") }],
        }),
      },
      prisma,
    );

    expect(await findReversalsOf(original.id, prisma)).toHaveLength(0);

    const reversal = await reverseJournalEntry(
      original.id,
      { reason: "find test", postedAt: new Date("2024-04-02T10:00:00.000Z") },
      prisma,
    );

    const found = await findReversalsOf(original.id, prisma);
    expect(found).toHaveLength(1);
    expect(found[0].id).toBe(reversal.id);
  });

  it("rejects empty reason", async () => {
    const original = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        postedAt: new Date("2024-05-01T10:00:00.000Z"),
        lines: buildBalancedEntry({
          debits: [{ accountCode: assetCode, amount: money(100n, "BRL") }],
          credits: [{ accountCode: revenueCode, amount: money(100n, "BRL") }],
        }),
      },
      prisma,
    );

    await expect(
      reverseJournalEntry(original.id, { reason: "" }, prisma),
    ).rejects.toBeInstanceOf(MissingReversalReasonError);

    await expect(
      reverseJournalEntry(original.id, { reason: "   " }, prisma),
    ).rejects.toBeInstanceOf(MissingReversalReasonError);
  });

  it("rejects nonexistent entry", async () => {
    await expect(
      reverseJournalEntry(
        "00000000-0000-0000-0000-000000000000",
        { reason: "valid reason" },
        prisma,
      ),
    ).rejects.toBeInstanceOf(EntryNotFoundError);
  });

  it("rejects reversal of a reversal", async () => {
    const original = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        postedAt: new Date("2024-06-01T10:00:00.000Z"),
        lines: buildBalancedEntry({
          debits: [{ accountCode: assetCode, amount: money(100n, "BRL") }],
          credits: [{ accountCode: revenueCode, amount: money(100n, "BRL") }],
        }),
      },
      prisma,
    );

    const reversal = await reverseJournalEntry(
      original.id,
      { reason: "first reversal", postedAt: new Date("2024-06-02T10:00:00.000Z") },
      prisma,
    );

    await expect(
      reverseJournalEntry(reversal.id, { reason: "should fail" }, prisma),
    ).rejects.toBeInstanceOf(CannotReverseReversalError);
  });

  it("rejects double reversal of the same original", async () => {
    const original = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        postedAt: new Date("2024-07-01T10:00:00.000Z"),
        lines: buildBalancedEntry({
          debits: [{ accountCode: assetCode, amount: money(100n, "BRL") }],
          credits: [{ accountCode: revenueCode, amount: money(100n, "BRL") }],
        }),
      },
      prisma,
    );

    await reverseJournalEntry(
      original.id,
      { reason: "first attempt", postedAt: new Date("2024-07-02T10:00:00.000Z") },
      prisma,
    );

    await expect(
      reverseJournalEntry(
        original.id,
        { reason: "second attempt — should fail", postedAt: new Date("2024-07-03T10:00:00.000Z") },
        prisma,
      ),
    ).rejects.toBeInstanceOf(EntryAlreadyReversedError);
  });

  it("idempotency: same key + same payload returns existing reversal", async () => {
    const original = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        postedAt: new Date("2024-08-01T10:00:00.000Z"),
        lines: buildBalancedEntry({
          debits: [{ accountCode: assetCode, amount: money(100n, "BRL") }],
          credits: [{ accountCode: revenueCode, amount: money(100n, "BRL") }],
        }),
      },
      prisma,
    );

    const key = `idempotency-test-${Date.now()}`;
    const first = await reverseJournalEntry(
      original.id,
      { reason: "idempotency test", idempotencyKey: key, postedAt: new Date("2024-08-02T10:00:00.000Z") },
      prisma,
    );

    const second = await reverseJournalEntry(
      original.id,
      { reason: "idempotency test", idempotencyKey: key, postedAt: new Date("2024-08-02T10:00:00.000Z") },
      prisma,
    );

    expect(second.id).toBe(first.id);
  });

  it("works inside an externally-provided transaction", async () => {
    const original = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        postedAt: new Date("2024-09-01T10:00:00.000Z"),
        lines: buildBalancedEntry({
          debits: [{ accountCode: assetCode, amount: money(300n, "BRL") }],
          credits: [{ accountCode: revenueCode, amount: money(300n, "BRL") }],
        }),
      },
      prisma,
    );

    const reversal = await prisma.$transaction(async (tx) => {
      return reverseJournalEntry(
        original.id,
        { reason: "tx test", postedAt: new Date("2024-09-02T10:00:00.000Z") },
        tx,
      );
    });

    expect(reversal.sourceKind).toBe("REVERSAL");
    expect(reversal.sourceId).toBe(original.id);
  });

  it("idempotency: same key for reversals of different originals → IdempotencyConflictError", async () => {
    const originalA = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        postedAt: new Date("2024-11-01T10:00:00.000Z"),
        lines: buildBalancedEntry({
          debits: [{ accountCode: assetCode, amount: money(100n, "BRL") }],
          credits: [{ accountCode: revenueCode, amount: money(100n, "BRL") }],
        }),
      },
      prisma,
    );

    const originalB = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        postedAt: new Date("2024-11-01T10:00:00.000Z"),
        lines: buildBalancedEntry({
          debits: [{ accountCode: assetCode, amount: money(200n, "BRL") }],
          credits: [{ accountCode: revenueCode, amount: money(200n, "BRL") }],
        }),
      },
      prisma,
    );

    const sharedKey = `cross-original-test-${Date.now()}`;

    await reverseJournalEntry(
      originalA.id,
      { reason: "first", idempotencyKey: sharedKey, postedAt: new Date("2024-11-02T10:00:00.000Z") },
      prisma,
    );

    await expect(
      reverseJournalEntry(
        originalB.id,
        { reason: "should fail — key in use by another reversal", idempotencyKey: sharedKey, postedAt: new Date("2024-11-02T10:00:00.000Z") },
        prisma,
      ),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
  });

  it("multi-line entry is reversed correctly", async () => {
    const original = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        postedAt: new Date("2024-10-01T10:00:00.000Z"),
        lines: buildBalancedEntry({
          debits: [
            { accountCode: assetCode, amount: money(7000n, "BRL") },
            { accountCode: liabilityCode, amount: money(3000n, "BRL") },
          ],
          credits: [
            { accountCode: revenueCode, amount: money(10000n, "BRL") },
          ],
        }),
      },
      prisma,
    );

    await reverseJournalEntry(
      original.id,
      { reason: "multi-line test", postedAt: new Date("2024-10-02T10:00:00.000Z") },
      prisma,
    );

    const reversalDetails = await getEntryDetails(
      (await findReversalsOf(original.id, prisma))[0].id,
      prisma,
    );
    expect(reversalDetails.lines).toHaveLength(3);
    const reversalAssetLine = reversalDetails.lines.find((l) => l.account.code === assetCode);
    const reversalLiabLine = reversalDetails.lines.find((l) => l.account.code === liabilityCode);
    const reversalRevLine = reversalDetails.lines.find((l) => l.account.code === revenueCode);
    expect(reversalAssetLine?.direction).toBe("C");
    expect(reversalLiabLine?.direction).toBe("C");
    expect(reversalRevLine?.direction).toBe("D");
  });
});
