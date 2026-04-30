import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { money } from "@/lib/money";
import { postJournalEntry } from "../post-journal-entry";
import { buildBalancedEntry } from "../build-balanced-entry";
import {
  AccountNotFoundError,
  AccountArchivedError,
  CurrencyMismatchError,
  InsufficientLinesError,
  NonPositiveAmountError,
  UnbalancedEntryError,
  InvalidSourceIdError,
  IdempotencyConflictError,
  UnsupportedCurrencyError,
} from "../errors";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL must be set to run ledger integration tests.");
}
const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

describe("postJournalEntry — integration", () => {
  let assetBrlCode: string;
  let liabBrlCode: string;
  let assetUsdCode: string;
  let archivedCode: string;

  beforeAll(async () => {
    const suffix = Date.now().toString(36);
    assetBrlCode = `test:asset:brl:${suffix}`;
    liabBrlCode = `test:liab:brl:${suffix}`;
    assetUsdCode = `test:asset:usd:${suffix}`;
    archivedCode = `test:archived:brl:${suffix}`;

    await prisma.account.create({
      data: { code: assetBrlCode, name: "Test Asset BRL", accountType: "ASSET", ownerKind: "PLATFORM", currency: "BRL" },
    });
    await prisma.account.create({
      data: { code: liabBrlCode, name: "Test Liab BRL", accountType: "LIABILITY", ownerKind: "PLATFORM", currency: "BRL" },
    });
    await prisma.account.create({
      data: { code: assetUsdCode, name: "Test Asset USD", accountType: "ASSET", ownerKind: "PLATFORM", currency: "USD" },
    });
    await prisma.account.create({
      data: { code: archivedCode, name: "Archived", accountType: "ASSET", ownerKind: "PLATFORM", currency: "BRL", archivedAt: new Date() },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("posts a balanced entry successfully", async () => {
    const entry = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        description: "happy path",
        lines: buildBalancedEntry({
          debits: [{ accountCode: assetBrlCode, amount: money(10000n, "BRL") }],
          credits: [{ accountCode: liabBrlCode, amount: money(10000n, "BRL") }],
        }),
      },
      prisma,
    );
    expect(entry.id).toBeDefined();
    expect(entry.sourceKind).toBe("MANUAL_ADJUSTMENT");
  });

  it("rejects invalid sourceId", async () => {
    await expect(
      postJournalEntry(
        {
          sourceKind: "MANUAL_ADJUSTMENT",
          sourceId: "not-a-uuid",
          lines: [
            { accountCode: assetBrlCode, direction: "D", amount: money(100n, "BRL") },
            { accountCode: liabBrlCode, direction: "C", amount: money(100n, "BRL") },
          ],
        },
        prisma,
      ),
    ).rejects.toBeInstanceOf(InvalidSourceIdError);
  });

  it("rejects nonexistent account", async () => {
    await expect(
      postJournalEntry(
        {
          sourceKind: "MANUAL_ADJUSTMENT",
          sourceId: crypto.randomUUID(),
          lines: [
            { accountCode: "this:does:not:exist", direction: "D", amount: money(100n, "BRL") },
            { accountCode: liabBrlCode, direction: "C", amount: money(100n, "BRL") },
          ],
        },
        prisma,
      ),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
  });

  it("rejects archived account", async () => {
    await expect(
      postJournalEntry(
        {
          sourceKind: "MANUAL_ADJUSTMENT",
          sourceId: crypto.randomUUID(),
          lines: [
            { accountCode: archivedCode, direction: "D", amount: money(100n, "BRL") },
            { accountCode: liabBrlCode, direction: "C", amount: money(100n, "BRL") },
          ],
        },
        prisma,
      ),
    ).rejects.toBeInstanceOf(AccountArchivedError);
  });

  it("rejects currency mismatch (line declares USD but account is BRL)", async () => {
    await expect(
      postJournalEntry(
        {
          sourceKind: "MANUAL_ADJUSTMENT",
          sourceId: crypto.randomUUID(),
          lines: [
            { accountCode: assetBrlCode, direction: "D", amount: money(100n, "USD") },
            { accountCode: liabBrlCode, direction: "C", amount: money(100n, "USD") },
          ],
        },
        prisma,
      ),
    ).rejects.toBeInstanceOf(CurrencyMismatchError);
  });

  it("rejects insufficient lines", async () => {
    await expect(
      postJournalEntry(
        {
          sourceKind: "MANUAL_ADJUSTMENT",
          sourceId: crypto.randomUUID(),
          lines: [{ accountCode: assetBrlCode, direction: "D", amount: money(100n, "BRL") }],
        },
        prisma,
      ),
    ).rejects.toBeInstanceOf(InsufficientLinesError);
  });

  it("rejects non-positive amount", async () => {
    await expect(
      postJournalEntry(
        {
          sourceKind: "MANUAL_ADJUSTMENT",
          sourceId: crypto.randomUUID(),
          lines: [
            { accountCode: assetBrlCode, direction: "D", amount: money(0n, "BRL") },
            { accountCode: liabBrlCode, direction: "C", amount: money(0n, "BRL") },
          ],
        },
        prisma,
      ),
    ).rejects.toBeInstanceOf(NonPositiveAmountError);
  });

  it("rejects unbalanced entry", async () => {
    await expect(
      postJournalEntry(
        {
          sourceKind: "MANUAL_ADJUSTMENT",
          sourceId: crypto.randomUUID(),
          lines: [
            { accountCode: assetBrlCode, direction: "D", amount: money(100n, "BRL") },
            { accountCode: liabBrlCode, direction: "C", amount: money(50n, "BRL") },
          ],
        },
        prisma,
      ),
    ).rejects.toBeInstanceOf(UnbalancedEntryError);
  });

  it("idempotency: same key + same payload → returns existing entry", async () => {
    const key = `test-idempotency-${Date.now()}`;
    const sourceId = crypto.randomUUID();
    const lines = [
      { accountCode: assetBrlCode, direction: "D" as const, amount: money(100n, "BRL") },
      { accountCode: liabBrlCode, direction: "C" as const, amount: money(100n, "BRL") },
    ];

    const first = await postJournalEntry(
      { sourceKind: "MANUAL_ADJUSTMENT", sourceId, idempotencyKey: key, lines },
      prisma,
    );

    const second = await postJournalEntry(
      { sourceKind: "MANUAL_ADJUSTMENT", sourceId, idempotencyKey: key, lines },
      prisma,
    );

    expect(second.id).toBe(first.id);
  });

  it("idempotency: same key + different payload → throws IdempotencyConflictError", async () => {
    const key = `test-idempotency-conflict-${Date.now()}`;
    const sourceId = crypto.randomUUID();

    await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId,
        idempotencyKey: key,
        lines: [
          { accountCode: assetBrlCode, direction: "D", amount: money(100n, "BRL") },
          { accountCode: liabBrlCode, direction: "C", amount: money(100n, "BRL") },
        ],
      },
      prisma,
    );

    await expect(
      postJournalEntry(
        {
          sourceKind: "MANUAL_ADJUSTMENT",
          sourceId,
          idempotencyKey: key,
          lines: [
            { accountCode: assetBrlCode, direction: "D", amount: money(200n, "BRL") }, // different amount
            { accountCode: liabBrlCode, direction: "C", amount: money(200n, "BRL") },
          ],
        },
        prisma,
      ),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
  });

  it("rejects unsupported currency in line (XYZ)", async () => {
    await expect(
      postJournalEntry(
        {
          sourceKind: "MANUAL_ADJUSTMENT",
          sourceId: crypto.randomUUID(),
          lines: [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { accountCode: assetBrlCode, direction: "D", amount: { amountCents: 100n, currency: "XYZ" as any } },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { accountCode: liabBrlCode, direction: "C", amount: { amountCents: 100n, currency: "XYZ" as any } },
          ],
        },
        prisma,
      ),
    ).rejects.toBeInstanceOf(UnsupportedCurrencyError);
  });

  it("posts within an externally-provided transaction", async () => {
    const sourceId = crypto.randomUUID();
    const result = await prisma.$transaction(async (tx) => {
      return postJournalEntry(
        {
          sourceKind: "MANUAL_ADJUSTMENT",
          sourceId,
          lines: [
            { accountCode: assetBrlCode, direction: "D", amount: money(500n, "BRL") },
            { accountCode: liabBrlCode, direction: "C", amount: money(500n, "BRL") },
          ],
        },
        tx,
      );
    });
    expect(result.id).toBeDefined();
  });

  it("uses postedAt = now() by default", async () => {
    const before = new Date();
    const entry = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        lines: [
          { accountCode: assetBrlCode, direction: "D", amount: money(100n, "BRL") },
          { accountCode: liabBrlCode, direction: "C", amount: money(100n, "BRL") },
        ],
      },
      prisma,
    );
    const after = new Date();
    expect(entry.postedAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(entry.postedAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
  });

  it("respects backdated postedAt", async () => {
    const past = new Date("2024-01-15T10:00:00Z");
    const entry = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        postedAt: past,
        lines: [
          { accountCode: assetBrlCode, direction: "D", amount: money(100n, "BRL") },
          { accountCode: liabBrlCode, direction: "C", amount: money(100n, "BRL") },
        ],
      },
      prisma,
    );
    expect(entry.postedAt.getTime()).toBe(past.getTime());
  });
});
